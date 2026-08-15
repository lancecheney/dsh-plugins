/**
 * @lancecheney/dsh-collapse-process — browser half.
 *
 * During streaming nothing changes. Once a turn settles, this plugin folds the
 * turn's process blocks — context injections (system prompt / skill catalog),
 * tool-call rows, command rows, and every assistant step except the closing
 * answer — into a single disclosure row pinned at the TOP of that turn's
 * process, exactly like DSH's own DisclosureRow (header stays put, content
 * expands beneath it). The final answer text always stays visible.
 */
window.__ModuleLoader__.load({
  id: "@lancecheney/dsh-collapse-process",
  factory: (require) => {
    const react = require("react");

    const NS = "collapse-process";
    const CONVERSATION_NS = "conversation";
    /** Every chat-node kind this plugin folds (unified wrapper). */
    const FOLD_KINDS = ["assistant-step", "context", "tool-call", "command", "compaction", "manual-compaction"];
    /** Kinds that are always process (never the closing answer). */
    const ALWAYS_PROCESS = {
      context: true,
      "tool-call": true,
      command: true,
      compaction: true,
      "manual-compaction": true,
    };

    const zh = {
      "fold.collapsed": "过程已折叠 · 展开",
      "fold.expanded": "收起过程",
      "fold.hint": "点击展开 / 收起本轮过程",
    };
    const en = {
      "fold.collapsed": "Process folded · Expand",
      "fold.expanded": "Collapse process",
      "fold.hint": "Click to expand / collapse this turn's process",
    };

    // ---- collapsed-state store, keyed by "sessionId#turn" (default collapsed) ----
    const collapseStore = (() => {
      const state = new Map();
      const listeners = new Set();
      let version = 0;
      const subscribe = (fn) => {
        listeners.add(fn);
        return () => {
          listeners.delete(fn);
        };
      };
      const getVersion = () => version;
      const isCollapsed = (key) => state.get(key) !== false;
      const setCollapsed = (key, value) => {
        const next = !!value;
        if (state.get(key) === next) return;
        state.set(key, next);
        version += 1;
        for (const fn of listeners) fn();
      };
      return {
        subscribe,
        getVersion,
        isCollapsed,
        setCollapsed,
        toggle: (key) => setCollapsed(key, !isCollapsed(key)),
      };
    })();

    /** Resolve the owning turn number of a Chat node from its engine Location. */
    function turnOf(node) {
      const loc = node && node.location;
      if (!loc) return undefined;
      if (loc.kind === "turn" || loc.kind === "step") {
        const t = loc.turn && loc.turn.turn;
        return typeof t === "number" ? t : undefined;
      }
      return undefined;
    }

    /** Whether a node is process (folds) rather than the closing answer or chrome. */
    function isProcessNode(node, closingSeq) {
      if (!node) return false;
      if (ALWAYS_PROCESS[node.kind]) return true;
      if (node.kind === "assistant-step") {
        const finalNode = node.data && node.data.finalNode;
        if (finalNode && closingSeq !== undefined && finalNode.seq === closingSeq) return false; // the answer
        return true;
      }
      return false;
    }

    /** Whether `myKey` is the FIRST process node of its turn (header anchor). */
    function isFirstProcessNode(snap, turn, myKey, closingSeq) {
      const chat = snap && snap.chat;
      if (!chat || !chat.order || !chat.nodes) return false;
      for (const key of chat.order) {
        const node = chat.nodes.get(key);
        if (!node) continue;
        if (turnOf(node) !== turn) continue;
        if (!isProcessNode(node, closingSeq)) continue;
        return key === myKey;
      }
      return false;
    }

    /** Find the base (non-shadow) renderer component registered for a chat-node key. */
    function baseComponent(ctx, key) {
      const entries = ctx.slots.entries("conversation.chat.node");
      let best;
      let bestPriority = -Infinity;
      for (const entry of entries) {
        if (entry.options.key !== key) continue;
        const priority = entry.options.priority === undefined ? 0 : entry.options.priority;
        if (priority >= bestPriority) {
          bestPriority = priority;
          best = entry.component;
        }
      }
      return best;
    }

    // ---- CSS (injected once at materialization) ----
    const css =
      ".cpx_header{display:inline-flex;align-items:center;gap:6px;height:24px;padding:0 8px;margin:2px 0;border:0;border-radius:6px;background:transparent;font-family:var(--dsw-font-family);font-size:12px;line-height:18px;color:var(--dsw-alias-label-secondary);cursor:pointer;white-space:nowrap}" +
      ".cpx_header:hover{background:var(--dsw-alias-interactive-bg-hover)}" +
      ".cpx_chevron{color:var(--dsw-alias-label-dimmed);font-size:10px;line-height:1}";
    const cssTagId = "@lancecheney/dsh-collapse-process/style.css";
    if (typeof document !== "undefined" && !document.querySelector('style[data-plugin-css="' + cssTagId + '"]')) {
      const tag = document.createElement("style");
      tag.dataset.plugin = "@lancecheney/dsh-collapse-process";
      tag.dataset.pluginCss = cssTagId;
      tag.textContent = css;
      document.head.appendChild(tag);
    }
    const cssModule = { header: "cpx_header", chevron: "cpx_chevron" };

    function FoldHeader(props) {
      const { turn, sessionId, foldT } = props;
      react.useSyncExternalStore(collapseStore.subscribe, collapseStore.getVersion);
      const key = sessionId + "#" + turn;
      const collapsed = collapseStore.isCollapsed(key);
      return react.createElement(
        "button",
        {
          type: "button",
          className: cssModule.header,
          onClick: () => collapseStore.toggle(key),
          title: foldT("fold.hint"),
        },
        react.createElement("span", { className: cssModule.chevron, "aria-hidden": true }, collapsed ? "\u25b8" : "\u25be"),
        react.createElement("span", null, collapsed ? foldT("fold.collapsed") : foldT("fold.expanded")),
      );
    }

    /**
     * One unified shadow wrapper for every folded kind.
     * - The closing answer: always visible, never folded, never a header anchor.
     * - The first process node of a settled turn: renders the pinned header
     *   above its own content (collapsed → header only).
     * - Every other process node: hidden while collapsed, shown while expanded.
     * - While the turn is still running (or has no closing answer): unchanged.
     */
    function makeFoldWrapper(defaultComponent) {
      return function CollapseFoldWrapper(props) {
        const { node, useSession, sessionId, useTurnData, foldT } = props;
        react.useSyncExternalStore(collapseStore.subscribe, collapseStore.getVersion);
        const turn = turnOf(node);
        const turnTail = useTurnData("turn-tail");
        const hasClosing = !!(turnTail && turnTail.closing);
        const closingSeq = hasClosing ? turnTail.closing.finalNode.seq : undefined;
        const myFinal = node.data && node.data.finalNode;
        const isClosing = !!(myFinal && closingSeq !== undefined && myFinal.seq === closingSeq);

        const turnDone = useSession((snap) => turn !== undefined && snap.turnEnds.has(turn));
        const myKey = node.key;
        const isFirst = useSession((snap) =>
          turn !== undefined && snap.turnEnds.has(turn) && isFirstProcessNode(snap, turn, myKey, closingSeq),
        );

        const key = sessionId + "#" + turn;
        const collapsed = collapseStore.isCollapsed(key);

        if (isClosing) return react.createElement(defaultComponent, props);
        if (turn === undefined || !turnDone || !hasClosing) return react.createElement(defaultComponent, props);

        const header = react.createElement(FoldHeader, { turn, sessionId, foldT });

        if (isFirst) {
          return collapsed
            ? header
            : react.createElement(react.Fragment, null, header, react.createElement(defaultComponent, props));
        }
        return collapsed ? null : react.createElement(defaultComponent, props);
      };
    }

    const inject = ["slots", "locale"];

    function apply(ctx) {
      ctx.effect(() => ctx.locale.register(NS, { zh, en }), "collapse-process: dictionaries");
      const foldT = ctx.locale.bind(NS);

      for (const kind of FOLD_KINDS) {
        ctx.slots.inject("conversation.chat.node", () => {
          const def = baseComponent(ctx, kind);
          if (!def) return () => {};
          return ctx.slots.register(
            {
              name: "conversation.chat.node",
              key: kind,
              priority: -1,
              locale: CONVERSATION_NS,
              inject: () => ({ foldT }),
            },
            makeFoldWrapper(def),
          );
        });
      }
    }

    return { apply, inject };
  },
});

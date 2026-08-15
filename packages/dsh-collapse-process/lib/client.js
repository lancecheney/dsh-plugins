/**
 * @lancecheney/dsh-collapse-process — browser half.
 *
 * During streaming nothing changes. Once a turn settles, this plugin folds the
 * turn's process blocks — context injections (system prompt / skill catalog),
 * tool-call rows, command rows, and reasoning-only assistant steps — into a
 * single disclosure row rendered right under that turn's final answer. The
 * answer text itself always stays visible; the fold can be expanded again.
 */
window.__ModuleLoader__.load({
  id: "@lancecheney/dsh-collapse-process",
  factory: (require) => {
    const react = require("react");

    const NS = "collapse-process";
    const CONVERSATION_NS = "conversation";
    const FOLDABLE_KINDS = ["context", "tool-call", "command", "compaction", "manual-compaction"];

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

    /** Whether a node participates in the per-turn process fold. */
    function isFoldableNode(node) {
      if (!node) return false;
      if (node.kind === "assistant-step") {
        const blocks = node.data && node.data.blocks;
        if (!Array.isArray(blocks)) return false;
        return !blocks.some((b) => b && b.kind === "text");
      }
      return FOLDABLE_KINDS.indexOf(node.kind) !== -1;
    }

    /** Whether the turn owns at least one foldable node. */
    function turnHasFoldable(snap, turn) {
      const chat = snap && snap.chat;
      if (!chat || !chat.order || !chat.nodes) return false;
      for (const key of chat.order) {
        const node = chat.nodes.get(key);
        if (!node) continue;
        if (turnOf(node) !== turn) continue;
        if (isFoldableNode(node)) return true;
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

    /** Shadow wrapper for pure-process node kinds: hide when the turn is settled+collapsed. */
    function makeProcessWrapper(defaultComponent) {
      return function CollapseProcessWrapper(props) {
        const { node, useSession, sessionId, useTurnData } = props;
        react.useSyncExternalStore(collapseStore.subscribe, collapseStore.getVersion);
        const turn = turnOf(node);
        const turnDone = useSession((snap) => turn !== undefined && snap.turnEnds.has(turn));
        const turnTail = useTurnData("turn-tail");
        if (turn === undefined || !turnDone) return react.createElement(defaultComponent, props);
        if (!(turnTail && turnTail.closing)) return react.createElement(defaultComponent, props);
        if (!collapseStore.isCollapsed(sessionId + "#" + turn)) return react.createElement(defaultComponent, props);
        return null;
      };
    }

    /** Shadow wrapper for assistant steps: keep the closing answer visible (+ fold header). */
    function makeAssistantWrapper(defaultComponent) {
      return function CollapseAssistantWrapper(props) {
        const { node, useSession, sessionId, useTurnData, foldT } = props;
        react.useSyncExternalStore(collapseStore.subscribe, collapseStore.getVersion);
        const turn = turnOf(node);
        const turnDone = useSession((snap) => turn !== undefined && snap.turnEnds.has(turn));
        const turnTail = useTurnData("turn-tail");
        const hasFoldable = useSession((snap) => turn !== undefined && turnHasFoldable(snap, turn));

        const blocks = node.data && node.data.blocks;
        const hasText = Array.isArray(blocks) && blocks.some((b) => b && b.kind === "text");
        const closingNode = turnTail && turnTail.closing ? turnTail.closing.finalNode : undefined;
        const myFinal = node.data && node.data.finalNode;
        const isClosing = hasText && !!(closingNode && myFinal && myFinal.seq === closingNode.seq);

        if (isClosing) {
          const content = react.createElement(defaultComponent, props);
          if (!turnDone || !hasFoldable) return content;
          return react.createElement(
            react.Fragment,
            null,
            content,
            react.createElement(FoldHeader, { turn, sessionId, foldT }),
          );
        }

        if (!hasText) {
          if (
            turn !== undefined &&
            turnDone &&
            turnTail &&
            turnTail.closing &&
            collapseStore.isCollapsed(sessionId + "#" + turn)
          ) {
            return null;
          }
        }

        return react.createElement(defaultComponent, props);
      };
    }

    const inject = ["slots", "locale"];

    function apply(ctx) {
      ctx.effect(() => ctx.locale.register(NS, { zh, en }), "collapse-process: dictionaries");
      const foldT = ctx.locale.bind(NS);

      ctx.slots.inject("conversation.chat.node", () => {
        const def = baseComponent(ctx, "assistant-step");
        if (!def) return () => {};
        return ctx.slots.register(
          {
            name: "conversation.chat.node",
            key: "assistant-step",
            priority: -1,
            locale: CONVERSATION_NS,
            inject: () => ({ foldT }),
          },
          makeAssistantWrapper(def),
        );
      });

      for (const kind of FOLDABLE_KINDS) {
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
            makeProcessWrapper(def),
          );
        });
      }
    }

    return { apply, inject };
  },
});

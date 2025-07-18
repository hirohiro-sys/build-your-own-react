todo: トレースで返却値なども確認しながらできるといいかも

# 処理の流れ

### やりたいこと
以下のjsxをレンダリングしたい。また、文言を変更したら更新されるようにしたい。

```jsx
import MyReact from "./main.js";

// viteの設定ファイル(vite.config.js)により、elementにはオブジェクト形式になったjsが入る
const element = <h1 title="foo">Hello</h1>;

const container = document.getElementById("root");
MyReact.render(element, container);
```

### 1. レンダリング開始

レンダリング(再レンダリング含)のエントリーポイント。

```js
let wipRoot = null;         // 作業中のルートを保持
let currentRoot = null;     // 現在レンダリング済のルートを保持
let deletions = null;       // 今回の作業で削除が必要なノードを保持
let nextUnitOfWork = null;  // 次処理の単位を保持
function render(element, container) {
  wipRoot = {
    dom: container,
    props: {
      children: [element],
    },
    alternate: currentRoot,
  };
  deletions = [];
  nextUnitOfWork = wipRoot;
}
```

ブラウザがアイドル状態の時(ユーザー操作が終わって時間が余ってる時など)にFiberツリーの構築を進める。


```js
requestIdleCallback(workLoop);
```

Fiberツリーを全て構築したら、現在のFiberツリー(currentRoot)と更新予定のFiberツリー(wipRoot)の差分を実DOMに反映する。

```js
function workLoop(deadline) {
  let shouldYield = false;
  // 次の作業があり、時間が残っている限り作業を続ける
  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
    shouldYield = deadline.timeRemaining() < 1;
  }
  // 作業が終わったら次の作業をスケジュールする
  requestIdleCallback(workLoop);

  // Fiberツリーを全て構築したらまとめて実DOMに反映
  if (!nextUnitOfWork && wipRoot) {
    commitRoot();
    wipRoot = null;
  }
}
```

### 2. Fiberツリーの構築
Fiberを作成し、次の作業単位を返している。

```js
function performUnitOfWork(fiber) {
  // 1. DOMを生成
  if (!fiber.dom) {
    fiber.dom = createDom(fiber);
  }
  // 2. Fiberノードを作成
  const elements = fiber.props.children;
  reconcileChildren(fiber, elements);

  // 3. 次のFiberを返す
  if (fiber.child) {
    return fiber.child;
  }
  let nextFiber = fiber;
  while (nextFiber) {
    if (nextFiber.sibling) {
      return nextFiber.sibling;
    }
    nextFiber = nextFiber.parent;
  }
}
```

DOM が null になっている場合は DOM を作成する

```js
function createDom(fiber) {
  const dom =
    fiber.type === "TEXT_ELEMENT"
      ? document.createTextNode(fiber.props.nodeValue)
      : document.createElement(fiber.type);

  Object.keys(fiber.props)
    .filter((key) => key !== "children")
    .forEach((name) => {
      dom[name] = fiber.props[name];
    });

  return dom;
}
```

reconcileChildren で Fiber ツリーの差分計算

```js
function reconcileChildren(wipFiber, elements) {
  let index = 0;
  let prevSibling = null;
  let oldFiber = wipFiber.alternate && wipFiber.alternate.child;

  while (index < elements.length) {
    const element = elements[index];
    let newFiber = null;
    const sameType = oldFiber && element && element.type === oldFiber.type;
    if (sameType) {
      newFiber = {
        type: oldFiber.type,
        props: element.props,
        dom: oldFiber.dom,
        parent: wipFiber,
        alternate: oldFiber,
        effectTag: "UPDATE",
      };
    }

    if (element && !sameType) {
      newFiber = {
        type: element.type,
        props: element.props,
        dom: null,
        parent: wipFiber,
        alternate: null,
        effectTag: "PLACEMENT",
      };
    }

    if (oldFiber && !sameType) {
      oldFiber.effectTag = "DELETION";
      deletions.push(oldFiber);
    }

    if (index === 0) {
      wipFiber.child = newFiber;
    } else {
      prevSibling.sibling = newFiber;
    }
    prevSibling = newFiber;
    index++;
  }
}
```

### 3. 実DOMにまとめて反映する

```js
function commitRoot() {
  deletions.forEach(commitWork);
  commitWork(wipRoot.child);
  currentRoot = wipRoot;
  wipRoot = null;
}
```

DFS で再帰的に反映

```js
function commitWork(fiber) {
  if (!fiber) return;
  const domParent = fiber.parent.dom;
  if (fiber.effectTag === "PLACEMENT" && fiber.dom !== null) {
    domParent.appendChild(fiber.dom);
  } else if (fiber.effectTag === "UPDATE" && fiber.dom !== null) {
    updateDom(fiber.dom, fiber.alternate.props, fiber.props);
  } else if (fiber.effectTag === "DELETION") {
    domParent.removeChild(fiber.dom);
  }
  commitWork(fiber.child);
  commitWork(fiber.sibling);
}
```

updateDom に関しては自前実装

```js
const isEvent = (key) => key.startsWith("on");
const isProperty = (key) => key !== "children" && !isEvent(key);
const isNew = (prev, next) => (key) => prev[key] !== next[key];
const isGone = (prev, next) => (key) => !(key in next);
function updateDom(dom, prevProps, nextProps) {
  // 古いイベントリスナーを削除 or 変更されたイベントリスナーを削除
  Object.keys(prevProps)
    .filter(isEvent)
    .filter(isGone(prevProps, nextProps) || isNew(prevProps, nextProps))
    .forEach((name) => {
      const eventType = name.toLowerCase().substring(2);
      dom.removeEventListener(eventType, prevProps[name]);
    });

  // 古いプロパティを削除
  Object.keys(prevProps)
    .filter(isProperty)
    .filter(isGone(prevProps, nextProps))
    .forEach((name) => {
      dom[name] = "";
    });

  // 新しいプロパティを設定
  Object.keys(nextProps)
    .filter(isProperty)
    .filter(isNew(prevProps, nextProps))
    .forEach((name) => {
      dom[name] = nextProps[name];
    });

  // 新しいイベントリスナーを設定
  Object.keys(nextProps)
    .filter(isEvent)
    .filter(isNew(prevProps, nextProps))
    .forEach((name) => {
      const eventType = name.toLowerCase().substring(2);
      dom.addEventListener(eventType, nextProps[name]);
    });
}
```

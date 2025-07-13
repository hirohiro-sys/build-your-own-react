### 処理の流れ

以下をレンダリングしたいとする。

vite の設定ファイルにより element にはすでに js コンパイル済みのオブジェクトが格納されている(はず)ので、render 関数から見ていく。

```jsx
import MyReact from "./main.js";

const element = <h1 title="foo">Hello</h1>;

const container = document.getElementById("root");
MyReact.render(element, container);
```

1. ルートの Fiber が作られる(ルートの Fiber ってなんだ？)

最初の作業単位(nextUnitOfWork)を設定し、これから描画する要素ツリー全体を子要素に指定

```js
let nextUnitOfWork = null;
function render(element, container) {
  nextUnitOfWork = {
    dom: container,
    props: {
      children: [element],
    },
  };
}
```

2. ブラウザがアイドル状態の時(ユーザー操作が終わって時間が余ってる時など)に描画を進める

```js
requestIdleCallback(workLoop);
```

以下 workLoop の実装。次の作業が存在し、時間があるなら処理をし続けている。

ループが終了(作業が全て終わっている or 時間切れ)した場合は次のアイドル時間にまた作業をするための予約をする。

```js
function workLoop(deadline) {
  let shouldYield = false;
  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
    shouldYield = deadline.timeRemaining() < 1;
  }
  requestIdleCallback(workLoop);
}
```

以下描画のメイン処理。ざっくりいうとレンダリング作業の1単位を行い、次の作業単位を返している

```js
function performUnitOfWork(unitOfWork) {
  // 1. DOMを生成
  if (!fiber.dom) {
    fiber.dom = createDom(unitOfWork);
  }
  if (fiber.parent) {
    fiber.parent.dom.appendChild(fiber.dom);
  }
  // 2. Fiberノードを作成
  const elements = fiber.props.children;
  let index = 0;
  let prevSibling = null;
  while (index < elements.length) {
    const element = elements[index];
    const newFiber = {
      type: element.type,
      props: element.props,
      parent: fiber,
      dom: null,
    };
    if (index === 0) {
      fiber.child = newFiber;
    } else {
      prevSibling.sibling = newFiber;
    }
    prevSibling = newFiber;
    index++;
  }
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
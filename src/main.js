function createElement(type, props, ...children) {
  return {
    type,
    props: {
      ...props,
      children: children.map((child) =>
        // 要素ツリー内の全てのノード(HTML、テキスト)を同じデータ構造(オブジェクト)で統一的に扱うため
        typeof child === "object" ? child : createTextElement(child)
      ),
    },
  };
}

function createTextElement(text) {
  return {
    type: "TEXT_ELEMENT",
    props: {
      nodeValue: text,
      children: [],
    },
  };
}

function createDom(fiber) {
  const dom =
    fiber.type === "TEXT_ELEMENT"
      ? document.createTextNode(fiber.props.nodeValue)
      : document.createElement(fiber.type);

  Object.keys(element.props)
    .filter((key) => key !== "children")
    .forEach((name) => {
      dom[name] = element.props[name];
    });

  element.props.children.forEach((child) => {
    render(child, dom);
  });

  container.appendChild(dom);
}

let nextUnitOfWork = null;
function render(element, container) {
  nextUnitOfWork = {
    dom: container,
    props: {
      children: [element],
    },
  };
}

function workLoop(deadline) {
  let shouldYield = false;
  // 次の作業があり、時間が残っている限り作業を続ける
  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
    shouldYield = deadline.timeRemaining() < 1;
  }
  // 作業が終わったら次の作業をスケジュールする
  requestIdleCallback(workLoop);
}

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

// ブラウザのアイドル時間にworkLoopを実行する
requestIdleCallback(workLoop);

// 自作Reactの本体
const MyReact = {
  createElement,
  render,
};

export default MyReact;

function createElement(type, props, ...children) {
  return {
    type,
    props: {
      ...props,
      children: children.map((child) =>
        // TODO: なぜテキストをオブジェクトに変換する必要がある？
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

function render(element, container) {
  const dom =
    element.type === "TEXT_ELEMENT"
      ? document.createTextNode(element.props.nodeValue)
      : document.createElement(element.type);

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

const MyReact = {
  createElement,
  render,
};

export default MyReact;

/* メモ
// 1. jsxでコンポーネントを定義
// function MyComponent() {
//   return <h1 title="foo">Hello</h1>
// }
// 2. jsxコンポーネントがcreateElement関数で以下のように変換される
const element = React.createElement("h1", { title: "foo" }, "Hello");
// const element = {
  //   type: "h1",
  //   props: {
  //     title: "foo",
  //     children: "Hello",
  //   },
  // };
      
// const container = document.getElementById('root');
// ReactDOM.render(<MyComponent />, container)
// 3. render関数では以下のような処理を行っている
// const container = document.getElementById("root");
// const node = document.createElement(element.type);
// node["title"] = element.props.title;
// const text = document.createTextNode("");
// text["nodeValue"] = element.props.children;
// node.appendChild(text);
// container.appendChild(node);
*/

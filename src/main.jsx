import MyReact from "./main.js";

// 以下の文言をいじれば更新が確認できる
const element = <h1 title="foo">Hello!</h1>;

const container = document.getElementById("root");
MyReact.render(element, container);

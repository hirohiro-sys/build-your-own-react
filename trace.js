const element = <h1 title="foo">Hello</h1>;

// {
//     dom: <root></root>
//     props: {
//         title: "foo",
//         children: [
//             {
//                 type: "h1",
//                 props: {
//                     title: "foo",
//                     children: [
//                         {
//                            type: "TEXT_ELEMENT",
//                             props: {
//                                  nodeValue: "Hello",
//                                  children: []
//                             } 
//                         }
//                     ]
//                 }
//             }
//         ]
//     children: {...}
//     }
// }



// {
//     type: "h1",
//     props: {
//         title: "foo",
//         children: [
//             {
//                 type: "TEXT_ELEMENT",
//                 props: {
//                     nodeValue: "Hello",
//                     children: [],
//                 },
//             },
//         ]
//     }
//     parent: {...},
//     dom: null ➡︎ <h1></h1>,
//     child: {...}
// }

{/* <div id="root"><h1>Hello</h1></div> */}

// {
//     type: "TEXT_ELEMENT",
//     props: {
//         nodeValue: "Hello",
//         children: [],
//     },
//     parent: {...element(h1のFiber)}
//     dom: null ➡︎ <TEXT_ELEMENT></TEXT_ELEMENT>
// }
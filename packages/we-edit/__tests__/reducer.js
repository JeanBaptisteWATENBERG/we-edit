import {createState} from "../src/state"
import immutable,{Map} from "immutable"
import Reducer from "../src/input/reducer"
import Input from "../src/input"
import {selection} from "../src/state/reducer"

describe("reducer",()=>{
    var uuid=1
    class StateDocument extends Input.Editable{
        constructor(content,_content){
            super()
            this.content=content.toJS()
            this._content=_content
        }

        makeId(){
            return `0${uuid++}`
        }

        renderNode({id}){
            const node=this.getNode(id)
            this._content.set(id,immutable.fromJS(node))
            if(Array.isArray(node.children)){
                node.children.forEach(a=>this.renderNode({id:a}))
            }
        }

        renderChanged(){
            this.renderNode(...arguments)
        }

        getNode(id){
            return this.content[id]
        }

        cloneNode({id}){
            const {id:_,...cloned}=this.getNode(id)
            cloned.id=this.makeId()
            if(Array.isArray(cloned.children)){
                clone.children.map(a=>this.cloneNode({id:a}))
            }
            return cloned
        }

        updateNode({id},changing){
            const node=this.getNode(id)
            this.content[id]={...node,...changing}
            this.renderChanged({id})
        }

        splitNode({id},at){
            const node=this.getNode(id)
            if(node.type=="text"){
                const text=node.children
                const cloned=this.cloneNode(node)
                this.updateNode(node,{children:text.substring(0,at)})
                cloned.children=text.substring(at)
                this.insertNodeAfter(cloned,node,{id:node.parent})
                return [{id:cloned.id,at:0},{id:cloned.id,at:0}]
            }else{
                throw new Error("not support")
            }
        }

        removeNode({id}){
            const node=this.getNode(id)
            const remove=id=>{
                const {children=[]}=this.getNode(id)
                if(Array.isArray(children)){
                    children.forEach(remove)
                }
                delete this.content[id]
            }
            remove(id)

            const parent=this.getNode(node.parent)
            parent.children=parent.children.filter(a=>a!=id)
            this.renderChanged(parent)
        }

        insertNodeBefore(newNode,referenceNode,parentNode){
            parentNode=this.getNode(parentNode.id)
            const i=referenceNode ? parentNode.children.indexOf(referenceNode.id) : parentNode.children.length
            newNode.id=newNode.id||this.makeId()
            if(this.content[newNode.id]){
                this.removeNode(newNode)
            }
            newNode.parent=parentNode.id
            this.content[newNode.id]=newNode
            parentNode.children.splice(i,0,newNode.id)
            this.renderChanged(parentNode)
        }

        insertNodeAfter(newNode,referenceNode,parentNode){
            const {children:siblings=[]}=this.getNode(parentNode.id)
            const beforeNode=!referenceNode ? siblings[0] : siblings[siblings.indexOf(referenceNode.id)+1]
            this.insertNodeBefore(newNode,{id:beforeNode},parentNode)
        }
    }

    const makeState=(data={})=>{
        const content=Object.keys({"1":{},"2":{},"3":{},...data}).reduce(
            (content,k)=>content.set(k,immutable.fromJS({id:k,parent:"root",props:{},...(data[k]||{})})),
            new Map()
                .set("root",immutable.fromJS({id:"root",type:"document",children:["1","2","3"]}))
        )
        const _content=content.asMutable()
        const doc=new StateDocument(content,_content)
        return createState(doc,content).set("_content",_content)
    }

    describe("utils",()=>{
        const test=(content,selectionx={})=>{
            const selection={cursorAt:"end",...selectionx}
            const state=makeState(content).set("selection",immutable.fromJS(selection))
            const reducer=new Reducer(state)
            expect(reducer.selection).toMatchObject(selection)
            return {selection,reducer}
        }

        it("cursorAt",()=>{
            const {reducer}=test()
            expect(reducer.cursorAt("1",1)).toMatchObject({start:{id:"1",at:1},end:{id:"1",at:1}})
            expect(reducer.cursorAt("1",2,"2",3)).toMatchObject({start:{id:"1",at:2},end:{id:"2",at:3}})
        })


    })


    describe("remove",()=>{
        const test=(content,selectionx={})=>{
            const selection={cursorAt:"end",...selectionx}
            const state=makeState(content).set("selection",immutable.fromJS(selection))
            const reducer=new Reducer(state)
            expect(reducer.selection).toMatchObject(selection)
            const composer={
                nextCursorable(){

                },
                prevCursorable(){

                }
            }
            const responsible={
                getComposer(){
                    return composer
                }
            }

            return {selection,reducer,responsible,composer,doc:reducer.file}
        }
        describe("forward",()=>{
            it("t|ext",()=>{
                const {reducer,composer,responsible}=test({
                    "1":{type:"paragraph",children:["1.1"]},
                    "1.1":{type:"text",children:"text",parent:"1"}
                })
                reducer.cursorAt("1.1",1)
                composer.nextCursorable=jest.fn(()=>({id:"1.1",at:2}))
                reducer.remove({responsible})
                expect(reducer.$(`#1.1`).text()).toBe("txt")
                expect(reducer.file.getNode("1.1").children).toBe("txt")
                expect(reducer.selection).toMatchObject({start:{id:"1.1",at:1},end:{id:"1.1",at:1}})
            })

            it("<p>text|</p>",()=>{
                const {reducer,composer,responsible}=test({
                    "1":{type:"paragraph",children:["1.1"]},
                    "1.1":{type:"text",children:"text",parent:"1"}
                })
                reducer.cursorAt("1",1)
                composer.nextCursorable=jest.fn(()=>({id:"1",at:1}))
                reducer.remove({responsible})
                expect(reducer.$(`#1.1`).text()).toBe("text")
                expect(reducer.file.getNode("1.1").children).toBe("text")
                expect(reducer.selection).toMatchObject({start:{id:"1",at:1},end:{id:"1",at:1}})
            })

            it("tex|tHello",()=>{
                const {reducer,composer,responsible}=test({
                    "1":{type:"paragraph",children:["1.1","1.2"]},
                    "1.1":{type:"text",children:"text",parent:"1"},
                    "1.2":{type:"text",children:"Hello",parent:"1"}
                })
                reducer.cursorAt("1.1",3)
                composer.nextCursorable=jest.fn(()=>({id:"1.2",at:0}))
                reducer.remove({responsible})
                expect(reducer.$(`#1.1`).text()).toBe("tex")
                expect(reducer.file.getNode(`1.1`).children).toBe("tex")
                expect(reducer.selection).toMatchObject({start:{id:"1.2",at:0},end:{id:"1.2",at:0}})
            })

            it("|image",()=>{
                const {reducer,composer,responsible,doc}=test({
                    "1":{type:"paragraph",children:["1.1","1.2"]},
                    "1.1":{type:"image",parent:"1"},
                    "1.2":{type:"text",children:"text",parent:"1"}
                })
                reducer.cursorAt("1.1",0)
                composer.nextCursorable=jest.fn(()=>({id:"1.2",at:0}))
                reducer.remove({responsible})
                expect(reducer.$('#1.1').length).toBe(0)
                expect(reducer.file.getNode('1.1')).toBeFalsy()
                expect(reducer.selection).toMatchObject({start:{id:"1.2",at:0},end:{id:"1.2",at:0}})
            })

            it("|<anchor>image</anchor>",()=>{
                const {reducer,composer,responsible,doc}=test({
                    "1":{type:"paragraph",children:["1.1","1.2"]},
                    "1.1":{type:"anchor",parent:"1",children:["1.1.1"]},
                    "1.1.1":{type:"image",parent:"1.1"},
                    "1.2":{type:"text",children:"text",parent:"1"}
                })
                reducer.cursorAt("1.1",0)
                composer.nextCursorable=jest.fn(()=>({id:"1.2",at:0}))
                reducer.remove({responsible})
                expect(reducer.$('#1.1,#1.1.1').length).toBe(0)
                expect(reducer.file.getNode('1.1')).toBeFalsy()
                expect(reducer.file.getNode('1.1.1')).toBeFalsy()
                expect(reducer.selection).toMatchObject({start:{id:"1.2",at:0},end:{id:"1.2",at:0}})
            })

            it("<p>|</p><p/>",()=>{
                const {reducer,composer,responsible,doc}=test({
                    "1":{type:"paragraph",children:["1.1"]},
                    "1.1":{type:"text",children:"text",parent:"1"},
                    "2":{type:"paragraph",children:["2.1"]},
                    "2.1":{type:"text",children:"text",parent:"2"},
                })
                reducer.cursorAt("1",1)
                composer.nextCursorable=jest.fn(()=>({id:"2.1",at:0}))
                reducer.remove({responsible})
                expect(reducer.$('#2').length).toBe(0)
                expect(reducer.file.getNode('2')).toBeFalsy()
                expect(reducer.$('#1').children().toArray()).toMatchObject(["1.1","2.1"])
                expect(reducer.selection).toMatchObject({start:{id:"2.1",at:0},end:{id:"2.1",at:0}})
            })

            describe("selection",()=>{
                it("t(ex)t",()=>{
                    const {reducer,composer,responsible}=test({
                        "1":{type:"paragraph",children:["1.1"]},
                        "1.1":{type:"text",children:"text",parent:"1"}
                    })
                    reducer.cursorAt("1.1",1,"1.1",3)
                    reducer.remove({responsible})
                    expect(reducer.$('#1.1').text()).toBe("tt")
                    expect(reducer.file.getNode('1.1').children).toBe("tt")
                    expect(reducer.selection).toMatchObject({start:{id:"1.1",at:1},end:{id:"1.1",at:1}})
                })

                fit("t(ext)Hello",()=>{
                    const {reducer,composer,responsible}=test({
                        "1":{type:"paragraph",children:["1.1","1.2"]},
                        "1.1":{type:"text",children:"text",parent:"1"},
                        "1.2":{type:"text",children:"hello",parent:"1"}
                    })
                    reducer.cursorAt("1.1",1,"1.2",0)
                    debugger
                    reducer.remove({responsible})
                    expect(reducer.$('#1.1').text()).toBe("t")
                    expect(reducer.file.getNode('1.1').children).toBe("t")
                    expect(reducer.selection).toMatchObject({start:{id:"1.2",at:0},end:{id:"1.2",at:0}})
                })

            })
        })

        describe("backword",()=>{
            it("t|ext",()=>{
                const {reducer,composer,responsible}=test({
                    "1":{type:"paragraph",children:["1.1"]},
                    "1.1":{type:"text",children:"text",parent:"1"}
                })
                reducer.cursorAt("1.1",1)
                composer.prevCursorable=jest.fn(()=>({id:"1.1",at:0}))
                reducer.remove({backspace:true,responsible})
                expect(reducer.$(`#1.1`).text()).toBe("ext")
                expect(reducer.file.getNode(`1.1`).children).toBe("ext")
                expect(reducer.selection).toMatchObject({start:{id:"1.1",at:0},end:{id:"1.1",at:0}})
            })

            it("|text",()=>{
                const {reducer,composer,responsible}=test({
                    "1":{type:"paragraph",children:["1.1"]},
                    "1.1":{type:"text",children:"text",parent:"1"}
                })
                reducer.cursorAt("1.1",0)
                composer.prevCursorable=jest.fn(()=>({id:"1.1",at:0}))
                reducer.remove({backspace:true,responsible})
                expect(reducer.$(`#1.1`).text()).toBe("text")
                expect(reducer.file.getNode(`1.1`).children).toBe("text")
                expect(reducer.selection).toMatchObject({start:{id:"1.1",at:0},end:{id:"1.1",at:0}})
            })

            it("image|Text",()=>{
                const {reducer,composer,responsible,doc}=test({
                    "1":{type:"paragraph",children:["1.1","1.2"]},
                    "1.1":{type:"image",parent:"1"},
                    "1.2":{type:"text",children:"text",parent:"1"}
                })
                reducer.cursorAt("1.2",0)
                composer.prevCursorable=jest.fn(()=>({id:"1.1",at:0}))
                composer.nextCursorable=jest.fn(()=>{
                    expect(reducer.selection).toMatchObject({start:{id:"1.1",at:0}})
                    return {id:"1.2",at:0}
                })
                reducer.remove({backspace:true,responsible})
                expect(reducer.$('#1.1').length).toBe(0)
                expect(reducer.file.getNode('1.1')).toBeFalsy()
                expect(reducer.selection).toMatchObject({start:{id:"1.2",at:0},end:{id:"1.2",at:0}})
            })

            it("<p/><p>|</p>",()=>{
                const {reducer,composer,responsible,doc}=test({
                    "1":{type:"paragraph",children:["1.1"]},
                    "1.1":{type:"text",children:"text",parent:"1"},
                    "2":{type:"paragraph",children:["2.1"]},
                    "2.1":{type:"text",children:"text",parent:"2"},
                })
                reducer.cursorAt("2.1",0)
                composer.prevCursorable=jest.fn(()=>({id:"1",at:1}))
                composer.nextCursorable=jest.fn(()=>{
                    expect(reducer.selection).toMatchObject({start:{id:"1",at:1}})
                    return {id:"2.1",at:0}
                })
                reducer.remove({backspace:true,responsible})
                expect(reducer.$('#2').length).toBe(0)
                expect(reducer.file.getNode('2')).toBeFalsy()
                expect(reducer.$('#1').children().toArray()).toMatchObject(["1.1","2.1"])
                expect(reducer.selection).toMatchObject({start:{id:"2.1",at:0},end:{id:"2.1",at:0}})
            })
        })
    })


    describe("create",()=>{

    })

    xdescribe("insert",()=>{
        describe("text",()=>{
            const test=(content,selectionx)=>{
                const selection={cursorAt:"end",...selectionx}
                const state=makeState(content).set("selection",immutable.fromJS(selection))
                const reducer=new Reducer(state)
                expect(reducer.selection).toMatchObject(selection)
                return {selection,reducer}
            }
            it("hello =>|",()=>{
                const {doc,reducer,selection}=test({
                    "1":{type:"paragraph",children:["1.1"]},
                    "1.1":{type:"text",children:"hello",parent:"1",props:{size:1}}
                },{start:{id:"1.1",at:1},end:{id:"1.1",at:1}})
                const updateNode=StateDocument.prototype.updateNode=jest.fn()
                reducer.insert("hello")
                expect(updateNode.mock.calls[0][0]).toMatchObject({id:"1.1",type:"text",children:"hhelloello"})
                expect(reducer.$('#1.1').text()).toBe("hhelloello")
            })

            it("hello =>{selection}",()=>{
                const {reducer,selection}=test({
                    "1":{type:"paragraph",children:["1.1"]},
                    "1.1":{type:"text",children:"hello",parent:"1",props:{size:1}}
                },{start:{id:"1.1",at:1},end:{id:"1.1",at:3}})
                reducer.insert("hello")
                expect(reducer.$(`#${1.1}`).text()).toBe("hhellolo")
            })
        })
    })

    xdescribe("update",()=>{
        describe("text",()=>{
            const test=(content,selectionx,doc={})=>{
                const selection={cursorAt:"end",...selectionx}
                const state=makeState(content,doc).set("selection",immutable.fromJS(selection))

                const reducer=new Reducer(state)
                expect(reducer.selection).toMatchObject(selection)
                doc.updateNode=jest.fn()
                doc.splitNode=jest.fn(({id},at)=>[{id,at},{id,at}])
                reducer.renderChanged=jest.fn()
                reducer.update({text:{size:5}})
                return {doc,selection,reducer}
            }
            it("cursor",()=>{
                const {doc,reducer,selection}=test({
                    "1":{type:"paragraph",children:["1.1"]},
                    "1.1":{type:"text",children:"hello",parent:"1",props:{size:1}},
                    "2":{type:"paragraph",children:["2.1"]},
                    "2.1":{type:"text",children:"hello",parent:"2",props:{size:1}},
                },{start:{id:"1.1",at:1},end:{id:"1.1",at:1}})

                expect(doc.updateNode).toHaveBeenCalledTimes(1)
                expect(doc.updateNode).toHaveBeenCalledWith({id:"1.1",type:"text"},{size:5})
                expect(reducer.renderChanged).toHaveBeenCalledWith("1")
                expect(reducer.selection).toMatchObject(selection)
            })

            it("inline text selection",()=>{
                const {doc,reducer,selection}=test({
                    "1":{type:"paragraph",children:["1.1"]},
                    "1.1":{type:"text",children:"hello",parent:"1",props:{size:1}},
                    "2":{type:"paragraph",children:["2.1"]},
                    "2.1":{type:"text",children:"hello",parent:"2",props:{size:1}},
                },{start:{id:"1.1",at:1},end:{id:"1.1",at:3}})

                expect(doc.updateNode).toHaveBeenCalledTimes(1)
                expect(doc.updateNode).toHaveBeenCalledWith({id:"1.1",type:"text"},{size:5})
                expect(reducer.renderChanged).toHaveBeenCalledWith("1")

                expect(reducer.selection).toMatchObject(selection)
            })

            it("cross text selection",()=>{
                const {doc,selection,reducer}=test({
                    "1":{type:"paragraph",children:["1.1"]},
                    "1.1":{type:"text",children:"hello",parent:"1",props:{size:1}},
                    "2":{type:"paragraph",children:["2.1"]},
                    "2.1":{type:"text",children:"hello",parent:"2",props:{size:1}},
                },{start:{id:"1.1",at:1},end:{id:"2.1",at:3},cursorAt:"end"})

                expect(doc.updateNode.mock.calls.map(([{id}])=>id)).toEqual(expect.arrayContaining(["1.1","2.1"]))
                expect(reducer.renderChanged.mock.calls.map(([id])=>id)).toEqual(expect.arrayContaining(["1","2"]))

                expect(reducer.selection).toMatchObject(selection)
            })

			it("textImagetext",()=>{
				const {doc,reducer,selection}=test({
                    "1":{type:"paragraph",children:["1.1","1.2","1.3"]},
                    "1.1":{type:"text",children:"hello",parent:"1",props:{size:1}},
					"1.2":{type:"image",parent:"1"},
					"1.3":{type:"text",children:"hello",parent:"1",props:{size:2}},

                    "2":{type:"paragraph",children:["2.1"]},
                    "2.1":{type:"text",children:"hello",parent:"2",props:{size:1}},
                },{start:{id:"1.1",at:1},end:{id:"2.1",at:3}})

                expect(doc.updateNode.mock.calls.map(([{id}])=>id)).toEqual(expect.arrayContaining(["1.1","1.3","2.1"]))
                expect(reducer.renderChanged.mock.calls.map(([id])=>id)).toEqual(expect.arrayContaining(["1","2"]))

				expect(reducer.selection).toMatchObject(selection)
			})
			it("<paragraph/>",()=>{
				const {doc,selection,reducer}=test({
                    "1":{type:"paragraph",children:["1.1","1.2","1.3"]},
                    "1.1":{type:"text",children:"hello",parent:"1",props:{size:1}},
					"1.2":{type:"image",parent:"1"},
					"1.3":{type:"text",children:"hello",parent:"1",props:{size:2}},

                    "2":{type:"paragraph",children:["2.1"]},
                    "2.1":{type:"text",children:"hello",parent:"2",props:{size:1}},
                },{start:{id:"2",at:0},end:{id:"2",at:1}})

                expect(doc.updateNode).toHaveBeenCalledTimes(1)
                expect(doc.updateNode.mock.calls[0][0]).toMatchObject({id:"2.1"})
                expect(reducer.renderChanged).toHaveBeenCalledWith("2")
                expect(reducer.selection).toMatchObject(selection)
			})
        })
    })

    describe("copy/paste",()=>{

    })

    describe("cut/paste",()=>{

    })
})

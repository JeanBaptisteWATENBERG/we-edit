import {createState} from "../src/state"
import immutable,{Map} from "immutable"
import Reducer from "../src/input/reducer"
import {selection} from "../src/state/reducer"


describe("reducer",()=>{
    const makeState=(data={},doc={})=>{
        const content=Object.keys({"1":{},"2":{},"3":{},...data}).reduce(
            (content,k)=>content.set(k,immutable.fromJS({id:k,parent:"root",props:{},...(data[k]||{})})),
            new Map()
                .set("root",immutable.fromJS({id:"root",type:"document",children:["1","2","3"]}))
        )
        return createState(doc,content).set("_content",content.asMutable())
    }

    describe("create",()=>{

    })

    describe("insert",()=>{

    })

    describe("update",()=>{
        describe("text",()=>{
            it("cursor",()=>{
                const doc={}
                const selection={start:{id:"1.1",at:1},end:{id:"1.1",at:1},cursorAt:"end"}
                const state=makeState({
                    "1":{type:"paragraph",children:["1.1"]},
                    "1.1":{type:"text",children:"hello",parent:"1",props:{size:1}},
                    "2":{type:"paragraph",children:["2.1"]},
                    "2.1":{type:"text",children:"hello",parent:"2",props:{size:1}},
                },doc).set("selection",immutable.fromJS(selection))

                const reducer=new Reducer(state)
                expect(reducer.selection).toMatchObject(selection)
                doc.updateNode=jest.fn()
                reducer.renderChanged=jest.fn()
                reducer.update({text:{size:5}})
                expect(doc.updateNode).toHaveBeenCalledTimes(1)
                expect(doc.updateNode).toHaveBeenCalledWith({id:"1.1",type:"text"},{size:5})
                expect(reducer.renderChanged).toHaveBeenCalledWith("1")

                expect(reducer.selection).toMatchObject(selection)
            })

            it("inline text selection",()=>{
                const doc={}
                const selection={start:{id:"1.1",at:1},end:{id:"1.1",at:3},cursorAt:"end"}
                const state=makeState({
                    "1":{type:"paragraph",children:["1.1"]},
                    "1.1":{type:"text",children:"hello",parent:"1",props:{size:1}},
                    "2":{type:"paragraph",children:["2.1"]},
                    "2.1":{type:"text",children:"hello",parent:"2",props:{size:1}},
                },doc).set("selection",immutable.fromJS(selection))

                const reducer=new Reducer(state)
                expect(reducer.selection).toMatchObject(selection)

                doc.updateNode=jest.fn()
                reducer.renderChanged=jest.fn()
                reducer.splitAtUpto=jest.fn()

                reducer.update({text:{size:5}})

                expect(reducer.splitAtUpto).toHaveBeenCalledTimes(2)
                return 

                expect(doc.updateNode).toHaveBeenCalledTimes(1)

                expect(doc.updateNode).toHaveBeenCalledWith({id:"1.1",type:"text"},{size:5})
                expect(reducer.renderChanged).toHaveBeenCalledWith("1")

                expect(reducer.selection).toMatchObject(selection)
            })

            xit("cross text selection",()=>{
                const doc={}
                const selection={start:{id:"1.1",at:1},end:{id:"2.1",at:3},cursorAt:"end"}
                const state=makeState({
                    "1":{type:"paragraph",children:["1.1"]},
                    "1.1":{type:"text",children:"hello",parent:"1",props:{size:1}},
                    "2":{type:"paragraph",children:["2.1"]},
                    "2.1":{type:"text",children:"hello",parent:"2",props:{size:1}},
                },doc).set("selection",immutable.fromJS(selection))

                const reducer=new Reducer(state)
                expect(reducer.selection).toMatchObject(selection)
                doc.updateNode=jest.fn()
                reducer.renderChanged=jest.fn()
                reducer.update({text:{size:5}})

                expect(doc.updateNode).toHaveBeenCalledTimes(1)

                expect(doc.updateNode).toHaveBeenCalledWith({id:"1.1",type:"text"},{size:5})
                expect(reducer.renderChanged).toHaveBeenCalledWith("1")

                expect(reducer.selection).toMatchObject(selection)
            })

        })
    })

    describe("remove",()=>{

    })

    describe("copy/paste",()=>{

    })

    describe("cut/paste",()=>{

    })
})

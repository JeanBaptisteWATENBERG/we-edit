import React, {Children,} from "react"
import PropTypes from "prop-types"


import {HasParentAndChild} from "./composable"
import {models} from "we-edit"
const {Paragraph:Base}=models

import opportunities from "./wordwrap/line-break"
import LineBreaker from "linebreak"
import {Text as ComposedText,  Group, Line, Story} from "./composed"

const {Info:LineInfo}=Story

const Super=HasParentAndChild(Base)
export class Paragraph extends Super{
	static contextTypes={
		...Super.contextTypes,
		Measure: PropTypes.func,
	}
    static childContextTypes={
        ...Super.childContextTypes,
        getMyBreakOpportunities: PropTypes.func,
		getLastText: PropTypes.func
    }

	constructor(){
		super(...arguments)
		this.computed.lastText=""
		this.computed.words=0
	}

    getChildContext(){
        let self=this
        return {
            ...super.getChildContext(),
			getLastText(){
				return self.computed.lastText
			},
            getMyBreakOpportunities(text){
				const {lastText}=self.computed
				if(!text){
					if(text===null)
						self.computed.lastText=""
					return [""]
				}

				const opportunities=str=>{
					let breaker=new LineBreaker(str)
					let last=0
					var op=[]
					for (let bk;bk = breaker.nextBreak();) {
					  op.push(str.slice(last, bk.position))

					  if (bk.required) {
					    //op.push("\n")
					  }

					  last = bk.position
					}
					return op
				}

				const current=opportunities(self.computed.lastText=`${lastText}${text}`)
				if(!lastText){
					self.computed.words+=current.length
					return current
				}

				const last=opportunities(lastText)
				const i=last.length-1

				let possible=current.slice(i)
				possible[0]=possible[0].substring(last.pop().length)
				self.computed.words+=(possible.length-1)
				return possible
            }
        }
    }

	get currentLine(){
		const {composed}=this.computed
		return composed[composed.length-1]
	}

    _newLine({width,...space}){
		const composableWidth=this.composableWidth(width)
        let line=new LineInfo({...space, width:composableWidth})
		if(this.props.numbering && this.computed.composed.length==0){
			let {numbering:{label}, indent:{firstLine}}=this.props
			let {defaultStyle}=new this.context.Measure(label.props)
			let hanging=-firstLine
			line.children.push(
				<Group
					descent={defaultStyle.descent}
					width={hanging}
					height={0}>
					<ComposedText {...defaultStyle}
						width={hanging}
						contentWidth={hanging}
						children={[label.props.children]}/>
				</Group>
			)
		}
		return line
    }

    composableWidth(width){
        const {indent:{left=0,right=0,firstLine=0}}=this.props
        width-=(left+right)
        if(!this.currentLine)
            width-=firstLine

        return width
    }

    appendComposed(content, il=0){//@TODO: need consider availableSpace.height
        const {width,minWidth=width,height,anchor,split}=content.props

        const {composed}=this.computed
		const createLine=()=>{
			const availableSpace=this.context.parent.nextAvailableSpace({width,height})
			composed.push(this._newLine(availableSpace))
		}

		if(!this.currentLine)
           createLine()

	    if(this.currentLine.availableHeight<height){
			const currentLine=this.currentLine
			this.computed.composed.pop()
			createLine()
			currentLine.content.forEach(a=>this.appendComposed(a))
		}

        const availableWidth=this.currentLine.availableWidth(minWidth)

		if(availableWidth>=minWidth || il>1){
			if(anchor){
				const {x,width}=this.context.parent.appendComposed(React.cloneElement(content,{x:this.currentLine.currentX}))
				this.currentLine.push(<Group x={x} width={width} height={0}/>)
			}else{
				this.currentLine.push(content)
			}
        }else{
			if(composed.length==1 && this.currentLine.isEmpty()){//empty first line
				if(split && false){
					const [p0,p1]=split(content,availableWidth)
					this.currentLine.push(p0)
					this.appendComposed(p1)
				}else{
					if(wrap){
						this.context.parent.appendComposed(content)
					}else{
						this.currentLine.push(content)
					}
				}
			}else{
				this.commitCurrentLine()
				createLine()
				this.appendComposed(content,++il)
			}
        }
    }

    commitCurrentLine(){
        if(this.currentLine){
			this.currentLine.commit()
			this.context.parent.appendComposed(this.createComposed2Parent(this.currentLine))
		}
    }

    onAllChildrenComposed(){//need append last non-full-width line to parent
		super.onAllChildrenComposed()
		this.commitCurrentLine()
    }

    createComposed2Parent(line){
        const {height, width, ...others}=line
        let {
			spacing:{lineHeight="100%",top=0, bottom=0},
			indent:{left=0,right=0,firstLine=0},
			align
			}=this.props

       lineHeight=typeof(lineHeight)=='string' ? Math.ceil(height*parseInt(lineHeight)/100.0): lineHeight
	   let contentY=(lineHeight-height)/2
	   let contentX=left

        if(this.computed.composed.length==1){//first line
            lineHeight+=top
            contentY+=top
            contentX+=firstLine
        }

        if(this.isAllChildrenComposed()){//the last line
            lineHeight+=bottom
			if(align=="justify" || align=="both"){//not justify the last line
				align=undefined
			}
        }

        return (
            <Line height={lineHeight} width={width}>
                <Group x={contentX} y={contentY} width={width} height={height}>
                   <Story width={width} height={height} {...others} align={align}/>
                </Group>
            </Line>
        )
    }
}



export default Paragraph

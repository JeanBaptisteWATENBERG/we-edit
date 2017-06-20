import React from "react"
import {Text} from "model/pagination"

export default class Query{
	constructor(document){
		this.document=document
		this.pages=document.computed.composed
		this.pgGap=document.context.pgGap
	}

	get y(){
		let {pages,pgGap}=this
		return pages.slice(0,pages.length-1)
			.reduce((w,{size:{height}})=>w+height+pgGap,(last=>{
				if(!last)
					return 0
				let lastColumnLines=last.columns[last.columns.length-1].children
				let lastLine=lastColumnLines[lastColumnLines.length-1]
				let height=last.margin.top
				if(lastLine)
					height+=lastLine.props.y+lastLine.props.height
				return height
			})(pages[pages.length-1]))
	}

	pageY(which){
		let {pages,pgGap}=this
		return pages.slice(0,which)
			.reduce((h,{size:{height}})=>h+height+pgGap,-pgGap)
	}

	at(x,y){
		let {pages,pgGap}=this
		let pageNo=(()=>{
			switch(pages.length){
				case 0: return -1
				case 1: return 0
				default: {
					let h=pages[0].size.height
					return pages.slice(1).findIndex(({size:{height}})=>h<y<(h+=height))+1
				}
			}
		})();
		let page=pages[pageNo]

		let columnNo=(columns=>{
			switch(columns.length){
				case 0: return -1
				case 1: return 0
				default: {
					return columns.find(({x:x0,width})=>x0<x<x0+width)
				}
			}
		})(page.columns);
		let column=page.columns[columnNo]

		let lineNo=((lines,pY)=>{
			return lines.findIndex(({props:{y:y0,height}})=>y0<=pY<=y0+height)
		})(column.children,
			y-pages.slice(0,pages.indexOf(page)).reduce((h,{size:{height}})=>h+=height,0)-page.margin.top
		);

		let line=this.traverse(column.children[lineNo],el=>{
			if(el.type==Line){
				return true
			}
		})

		let pieces=line.props.children
		let offsetX=x-page.margin.right-column.x
		let piece=pieces.find((offsetX,piece)=>{
			if(0<=offsetX<=piece.props.width){
				return true
			}else{
				offsetX-=piece.props.width
			}
		})

		piece=this.traverse(piece,el=>{
			if('data-content' in el.props && 'data-endAt' in el.props){
				return true
			}
		})

		let id=piece.props["data-content"]
		let from=piece.props["data-endAt"]

		let style=this.getStyle(piece)

		let wordwrapper=new Text.WordWrapper(style)
		let content=getContent(this.state,id).toJS()
		let end=wordwrapper.widthString(offsetX, content.children.substr(from))
		offsetX=wordwrapper.stringWidth(content.children.substr(from,end))
		return {
			page: pageNo,
			column: columnNo,
			line: lineNo,
			id,
			at: from+end,
			style
		}
	}

	getStyle({props:{fontFamily, fontSize, fontWeigth, fontStyle}}){
		return {fontFamily, fontSize, fontWeigth, fontStyle}
	}

	getComposer(id){
		let {pages,pgGap}=this
		let pageNo, columnNo,lineNo,node
		pages.findIndex(page=>{
			this.traverse(page,function({type,props},parent,index){
				if(parent.type=="column"){
					lineNo=index
				}else if(parent.type="page"){
					columnNo=index
				}
				if(type=="text"){
					let {"data-content":dataId,"data-endAt":dataEndAt}=props
					if(dataId==id && at<=dataEndAt){
						node=arguments[0]
						return true
					}
				}
			})
			return !!node
		})
	}

	position(id,at){
		let {pages,pgGap}=this
		let columnNo,lineNo,node, path=[]
		let pageNo=pages.findIndex(page=>{
			this.traverse(page,function({type,props},parent,index){
				if(parent.type=="column"){
					lineNo=index
				}else if(parent.type=="page"){
					columnNo=index
				}
				if(type.name=="Text"){
					let {"data-content":dataId,"data-endAt":dataEndAt}=props
					if(dataId==id && at<=dataEndAt){
						node=arguments[0]
						return true
					}
				}
			})
			return !!node
		})

		if(node){
			return {
				page: pageNo,
				column: columnNo,
				line: lineNo,
				node
			}
		}
	}

	nextLine(id,at){
		let {pages,pgGap}=this
		let pageNo, columnNo,lineNo,node
		pages.findIndex(page=>{
			this.traverse(page,function({type,props},parent,index){
				if(parent.type=="column"){
					lineNo=index
				}else if(parent.type="page"){
					columnNo=index
				}
				if(type==Text){
					let {"data-content":dataId,"data-endAt":dataEndAt}=props
					if(dataId==id && at<=dataEndAt){
						node=arguments[0]
						return true
					}
				}
			})
			return !!node
		})

		let column=pages[pageNo].columns[columnNo]
		let line=column.children[lineNo]
		let x=column.x+line

		let next=column.children[lineNo+1]



	}

	prevLine(id,at){
		let {pages,pgGap}=this
	}

	traverse(node, f, right=false){
		let children
		switch(node.type){
		case "page":
			children=node.columns
			break
		case "column":
			children=node.children
			break
		default:
			if(node.type==Text){
				return
			}if(node.props && node.props.children){
				children=React.Children.toArray(node.props.children)
			}else
				return
		}

		return !!children[`find${right ? "Last" :""}`]((child,i)=>{
			let result=f(child,node,i)
			if(result===true){
				return true
			}else if(result===false){
				return false
			}else{
				return !!this.traverse(child,f,right)
			}
		})
	}
}

import React, {Component, PropTypes} from "react"
import {HasChild, togglable} from "./any"
import Group from "../composed/group"
import Page from "../composed/page"

export default class Document extends HasChild{
	static displayName="document"

	render(){
		const {composed, state:{content}, props:{width, height}}=this
		const {documentStyles, pageGap, ...others}=this.props
        return (
			<svg {...others}
				ref="svg"
				width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
				{super.render()}
				<Composed ref="composed" gap={pageGap} canvas={{width}} sections={()=>
					this.children.reduce((collected, section)=>{
						collected.push(section.composed)
						return collected
					},[])}
					/>
				{this.more()}
			</svg>
		)
    }

    static childContextTypes=Object.assign({
        getDefaultStyle: PropTypes.func,
		containerStyle: PropTypes.object
    },HasChild.childContextTypes)

    getChildContext(){
		const documentStyles=this.props.documentStyles
        const {width, pageGap, contentStyle}=this.props
		return Object.assign(super.getChildContext(),{
            getDefaultStyle(type){
				return documentStyles.getDefault(type)
			},
			containerStyle:contentStyle
        })
    }

	appendComposed(page){
		if(this.refs.composed)
			this.refs.composed.setState({composedTime: new Date().toString()})
	}

	componentDidMount(){
		let {pageGap, width, height}=this.props
		const {svg}=this.refs
		let size=this.composed.reduce((last,a)=>({
				height: last.height+a.size.height+pageGap,
				width:Math.max(last.width,a.width)}),{height:pageGap, width:width})

		height=	Math.max(size.height, height)
		svg.setAttribute('height',height)
		svg.setAttribute('viewBox',`0 0 ${width} ${height}`)
	}

	componentDidUpdate(){
		this.componentDidMount()
	}

	more(){
		return null
	}

	static defaultProps={
		width: window.innerWidth,
		height: window.innerHeight,
		pageGap: 20,
		style: {
			background:"lightgray"
		}
	}


}

class Composed extends Group{
	render(){
		const {sections, gap, canvas}=this.props
		let sectionY=gap
		return (
			<Group y={gap}>
			{
				sections().map((pages,i,a,b,y=0)=>{
					return <Group y={sectionY} key={i}>{
						pages.map((page,i)=>{
							let newPage=(<Group y={y} x={(canvas.width-page.size.width)/2} key={i}><Page {...page}/></Group>)
							y+=(page.size.height+gap)
							sectionY+=(page.size.height+gap)
							return newPage
						})
					}</Group>
				})
			}
			</Group>
		)
	}
}

import React, {Fragment, PureComponent as Component} from "react"
export default class Text extends Component{
	render(){
		const {
			children, whiteSpace, color:fill, highlight,border,underline,strike,
			descent,minWidth, height, width, blockOffset,mergeOpportunity,//ignore
			y,
			...others}=this.props

		let background=null
		if(highlight || border){
			let props={
					width:Math.ceil(width),
					height:Math.ceil(height),
					fill:highlight||"none",
					x:0,y:y-height+descent
				}
			if(border){
				props.stroke="black"
				props.strokeWidth=0.5
			}
			background=(<rect {...props}/>)
		}
		let decoration=null
		if(underline){
			let y=Math.ceil(descent/2)
			let strokeWidth=(a=>{
					switch(underline){
						case "double":
							return a*2;
						default:
							return a
					}
				})(0.5)
			decoration=(<line y1={y} x2={width} y2={y} stroke="black" strokeWidth={strokeWidth}/>)
		}

		let strikeline=null
		if(strike){
			let y=-descent
			strikeline=(<line y1={y} x2={width} y2={y} stroke="black" strokeWidth={0.5}/>)
		}
		return (
			<Fragment>
				{background}
				{strikeline}
				{decoration}
				<text style={{userSelect:"none",whiteSpace:"pre",cursor:"text"}}
					y={y||0}
					{...others}
					fill={fill}>
					{children}
				</text>
			</Fragment>
		)
	}

	static Dynamic=({children, ...props})=><Text {...props} children={children()}/>
}
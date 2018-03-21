import React, {Component} from "react"
import PropTypes from "prop-types"

import get from "lodash.get"

export default function(Models){
	class Section extends Models.Section{
		static displayName=`docx-${Models.Section.displayName}`
		static propTypes={
			...Models.Section.propTypes,
			titlePg:PropTypes.bool
		}

		static contextTypes={
			...Models.Section.contextTypes,
			evenAndOddHeaders: PropTypes.bool
		}

		//check http://officeopenxml.com/WPsectionFooterReference.php
		getPageHeaderFooter(category, pageNo){
			category=this.computed[`${category}s`]
			var type='default', target
			if(typeof(pageNo)=="string")
				type=pageNo
			else if(pageNo==1 && this.props.titlePg)
				type="first"
			else if(this.context.evenAndOddHeaders)
				type=pageNo%2==0 ? 'even' : 'default'

			if(type)
				target=get(category,type)

			if(target)
				return target

			let prevSection=this.context.prevSibling(this)
			if(!prevSection)
				return

			return prevSection.getPageHeaderFooter(category,type)
		}
	}
	
	
	return class extends Component{
		static displayName=`docx-section`
		static propTypes={
			...Section.propTypes,
			cols: PropTypes.shape({
				num: PropTypes.number.isRequired,
				space: PropTypes.number,
				data: Section.propTypes.cols
			})
		}
		
		static defaultProps={
			...Section.defaultProps,
			cols:{
				num:1
			}
		}
		
		constructor(){
			super(...arguments)
			this.componentWillReceiveProps(this.props)
		}

		componentWillReceiveProps({pgSz:{width},  pgMar:{left, right}, cols:{num=1, space=0, data}}){
			let availableWidth=width-left-right
			this.cols=data ? data : new Array(num).fill({width:(availableWidth-(num-1)*space)/num,space})
		}
		
		render(){
			return <Section {...this.props} cols={this.cols}/>
		}
	}
}

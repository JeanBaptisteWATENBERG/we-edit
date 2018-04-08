import PropTypes from "prop-types"
import {Emitter} from "we-edit"
import {Output} from "we-edit-representation-pagination"
import PDFDocument from "pdfkit"

export default class PDF extends Output{
	static displayName="PDF"
	static propTypes={
		type: PropTypes.string.isRequired,
		name: PropTypes.string.isRequired,
		ext: PropTypes.string.isRequired,
		representation: PropTypes.string.isRequired,
	}

	static defaultProps={
		type:"pdf",
		name:"PDF Document",
		ext:"pdf",
		representation: "pagination"
	}

	onDocument(){
		super.onDocument()
		this.pdf=new PDFDocument({autoFirstPage:false})
		this.pdf.pipe(this.props.stream)
	}
	
	onPage(){
		this.pdf.addPage()
	}
	
	onText({text,x=0,y=0,fontSize,fontWeight,fontFamily,fill}){
		let {x:x0,y:y0}=this.offset
		x+=x0
		y+=y0
		this.pdf.text(text,x,y)
	}
	
	onImage({width,height,...props}){
		let {x,y}=this.offset
		let href=props["xlink:href"]
		let job=fetch(href)
			.then(res=>{
				if(!res.ok){
					throw new Error(res.statusText)
				}
				return res.arrayBuffer()
			})
			.then(buffer=>this.pdf.image(buffer,x,y-height,width,height))
		this.addAsyncJob(job)
	}
	
	onDocumentEnd(){
		this.pdf.end()
		super.onDocumentEnd()
		this.pdf=null
	}
}

Emitter.support(PDF)

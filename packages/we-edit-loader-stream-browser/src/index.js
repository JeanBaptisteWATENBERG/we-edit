import React from "react"
import {Writable} from "readable-stream"
import {Stream, Loader, Input} from "we-edit"

import TextField from "material-ui/TextField"

const support=()=>{
	try{
		return window.URL.createObjectURL && document.createElement
	}catch(e){
		return false
	}
}
/**
* options:
* name: only for download
* target: show on iframe/window
*/
export class Writer extends Stream.Base{
	static defaultProps={
		...Stream.Base.defaultProps,
		type:"browser",
	}
	static support=support

	state={
		windowFeatures:"menubar=no,location=no,resizable=yes,scrollbars=yes,status=no",
		...this.props
	}

	componentWillReceiveProps({format,fixName}){
		if(this.props.format!=format){
			this.setState({name:fixName(this.state.name)})
		}
	}

	render(){
		const {name, target, windowFeatures}=this.state
		return (
			<center>
				<div>
					<TextField
						value={name||""}
						floatingLabelText="file name"
						onChange={(e,name)=>this.setState({name})}/>
				</div>
				<div>
					<TextField
						value={target||""}
						floatingLabelText="target:_blank|_self|_parent|_top|frame name"
						onChange={(e,target)=>{
							if(target){
								this.setState({target,name:""})
							}else{
								this.setState({target,name:this.props.name})
							}
						}}/>
				</div>
				<div>
					<TextField
						value={windowFeatures||""}
						floatingLabelText="window features"
						onChange={(e,windowFeatures)=>{
							this.setState({windowFeatures})
						}}/>
				</div>
			</center>
		)
	}

	create(){
		const data=this.data=[]
		const stream=new Writable({
			write(chunk,enc, next){
				data.push(chunk)
				next()
			}
		})

		stream.on("error",function(e){
			console.error(e)
		})

		const {name,format,target,windowFeatures}=this.props
		stream.on("finish",()=>{
            if(target){
				this.preview(target,windowFeatures)
            }else {
               this.download(name.indexOf(".")!=-1 ? name : `${name}.${format}`)
            }
        })

		return stream
	}

    download(name){
        let url = window.URL.createObjectURL(this.blob)
        let link = document.createElement("a");
        document.body.appendChild(link)
        link.download = name
        link.href = url;
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
    }

    preview(target,windowFeatures){
		let src=window.URL.createObjectURL(this.blob)
		if(windowFeatures){
			let winPreview=window.open(src,target||"we-edit-previewer",windowFeatures)
			winPreview.addEventListener("beforeunload",()=>window.URL.revokeObjectURL(src))
		}else{
			let a=document.createElement("a")
			let body=document.querySelector('body')
			a.href=src
			a.target=target||"we-edit-previewer"
			body.appendChild(a)
			a.click()
			body.removeChild(a)
		}
    }

	get blob(){
		switch(this.props.format){
		case 'svg':
			return new Blob(this.data,{type:"image/svg+xml"})
		break
		default:
			return new Blob(this.data, {type:"application/"+this.props.format})
		}
	}
}

export class Reader extends Loader.Base{
    static displayName="loader-browser"

    static defaultProps={
		...Loader.Base.defaultProps,
        type:"browser"
    }

	static support=support

	constructor(){
		super(...arguments)
		this.state={}
	}

    render(){
		const {done}=this.state
		if(done)
			return null
		const {onLoad}=this.props
		const supports=Input.supports
		const types=Array.from(supports.values())
			.map(a=>a.defaultProps.ext)
			.filter(a=>!!a).join(",").split(",")
			.map(a=>"."+a)
		return <InputOnce
			key={Date.now()}
			type="file"
			accept={types.join(",")}
            onChange={({target})=>{
				const file=target.files[0]
                const reader=new FileReader()
				reader.onload=e=>{
					onLoad({
						data:e.target.result,
						mimeType:file.type,
						name:file.name
					})
				}
				reader.readAsArrayBuffer(file)
				target.value=""
				this.setState({done:true})
            }}
            style={{position:"fixed", left:-9999}}/>
    }
}

class InputOnce extends React.Component{
	render(){
		return <input ref="input" {...this.props}/>
	}

    componentDidMount(){
		this.refs.input.click()
	}
}

export default {
	install(){
		Reader.install()
		Writer.install()
	},

	uninstall(){
		Reader.uninstall()
		Writer.uninstall()
	}
}

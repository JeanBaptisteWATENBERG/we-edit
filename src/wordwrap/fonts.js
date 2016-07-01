import opentype from "opentype.js"

var fonts={}

export default {
    get(name){
		if(!fonts[name]){
			return fonts[name]=loadFont(name)
		}else{
            throw new Error(`${name} not exists`)
        }
    }
}


class Font{
    constructor(data, id){
        this.data=data
        this.id=id
    }

	metrics(word,opt){
        const {size}=opt
        //this.data.stringTo
		return {width:0, height:0, glyphs:[]}
	}
}

export function loadFont(){
    let loader=document.querySelector('#fonts')
    loader.onchange=function(e){
        for(let i=0, file, len=this.files.length;i<len;i++){
            file=this.files[i]
            {
                let name=file.name
                let reader=new FileReader()
                reader.onload=e=>{
                    let data=reader.result
                    let font=opentype.parse(data)
                    if(font.supported){
                        let id=name.split(".")[0].toLowerCase()
                        fonts[id]=new Font(font,id)
                        console.log(`${name} font loaded`)
                    }else{
                        console.error(`${name} font loaded fail`)
                    }
                }
                reader.readAsArrayBuffer(file)
            }
        }

        loader.value=""
    }
}

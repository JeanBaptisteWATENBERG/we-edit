/**
 * it's to describe space that layout engine use
 * left <--> right: inline size
 * blockOffset: current block offset
 * height: available block size, blockOffset <--->last block layout opportunities
 * wrappees: excluded areas in a space
 */

/**
 * space can be constrained by inline size, block size, or both, 
 * and exclusive wrappees
 */
 export default class Space{
    static create(source){
        if(source instanceof Space)
            return source
        return new Space(...arguments)
    }

     constructor({width,left=0,right,...props}={}){
        Object.assign(this,props)
        this.props=arguments[0]||{}
     }

     get width(){
        const {left,right,width=right-left}=this.props
        return width
     }

     get left(){
         const {left=0}=this.props
         return left
     }

     get right(){
         const {width,right=width}=this.props
         return right
     }

     clone(modifier){
         if(modifier instanceof Space){
            modifier=modifier.props
         }
         return new Space({...this.props, ...modifier,edges:{...this.props.edges, ...modifier.edges,}})
     }

     anchor({base, offset=0, align},{width=0,height=0}={}){
        const {edges}=this.props
        if(!edges || !edges[base] || !(align in edges[base]))
            return 0
        
        const {[base]:{[align]:v=0}={}}=edges
        switch(align){
            case "right": 
                return v-offset-width
            case "bottom": 
                return v-offset-height
            default: 
                return v+offset 
        }
     }
 }
 

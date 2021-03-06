import PropTypes from "prop-types"
import HasChild from "./hasChild"

export default A=>{
	const Super=HasChild(A)
    return class __$1 extends Super{
        static contextTypes = {
            ...Super.contextTypes,
            parent: PropTypes.object
        }
        /**
         * children should call before composing line,
         * return next line rect {*width, [height], [greedy(text)=true], [wordy(text)=true]}
         */
        nextAvailableSpace() {
            return this.context.parent.nextAvailableSpace(...arguments)
        }

        /**
         * children should call after a line composed out
         * a chance to add to self's composed
         */
        appendComposed() {
            return this.context.parent.appendComposed(this.createComposed2Parent(...arguments))
        }
    }
}

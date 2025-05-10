//@ts-check

/**
 * mutex that allows locking and unlocking of code blocks  
 * multiple locks can be held at once, but only up to a specified number  
 * if the max number of locks is reached, new locks will wait until a lock is released  
 * by default, the mutex will only allow one lock at a time
 */
export class MutexAsync{
	/** maximum number of times the mutex can be locked at once */
	maxLocks = 1
	/** if the mutex should log to the console when a lock is forced to wait for another to complete */
	warnOnOverlap = false
	
	_locked = 0
	_waitList = []
	
	/**
	 * creates new mutex
	 * maxLocks defaults to 1, meaning only one lock can be held at a time
	 * warnOnOverlap defaults to false, meaning no warnings will be logged to the console when a lock is forced to wait for another to complete
	 * @param {{maxLocks?: number, warnOnOverlap?: boolean}} [options]
	 */
	constructor(options){
		if(options){
			if(options.maxLocks){
				this.maxLocks = options.maxLocks
			}
			if(options.warnOnOverlap){
				this.warnOnOverlap = options.warnOnOverlap
			}
		}
	}
	
	/**
	 * unlocks the mutex, allowing the next waiting lock to proceed  
	 * do not call this more than once per lock call  
	 * alternatively use the unlock function returned by lock() which is checked for multiple calls  
	 * @returns {Promise<void>} - resolves when the mutex is fully unlocked and the next lock has started executing
	 */
	async unlock(){
		if(this._locked <= 0){
			console.error(new Error("mutex release violated"))
		}
		this._locked--
		if(this._waitList.length != 0){
			let nextResolve = this._waitList.shift()
			this._locked++
			nextResolve(this.createUnlockFunction())
		}
	}
	
	/**
	 * locks the mutex, preventing other locks from executing until it is unlocked  
	 * if the mutex is already locked, the promise will resolve when the mutex is unlocked  
	 * the promise resolves with a function that unlocks the mutex
	 * it is recommended to use the unlock function returned by lock() instead of calling unlock() directly because it prevents multiple unlocks from being called accidentally
	 * @returns {Promise<Function>} - resolves when the lock is available
	 */
	lock(){
		return new Promise((resolve,reject) => {
			if(this._locked >= this.maxLocks){
				this._waitList.push(resolve)
				if(this.warnOnOverlap){
					console.warn("mutex lock delayed execution")
				}
			}else{
				this._locked++
				resolve(this.createUnlockFunction())
			}
		})
	}
	
	/**
	 * creates a function that unlocks the mutex when called, the resulting function will only unlock the mutex once, subsequent calls will have no effect
	 * @returns {Function}
	 */
	createUnlockFunction(){
		let hasUnlocked = false
		let self = this
		return () => {
			if(!hasUnlocked){
				self.unlock()
				hasUnlocked = true
			}
		}
	}
	
	/**
	 * checks if the mutex is currently locked  
	 * if multiple locks are allowed, this will only return true if all locks are currently held
	 * @returns {boolean}
	 */
	isLocked(){
		return this._locked >= this.maxLocks
	}
	
	/**
	 * runs a async function with the mutex locked  
	 * the mutex will be automatically unlocked when the function completes  
	 * if the function throws an error, the mutex will still be unlocked and the error will be rethrown
	 * @param {Function} func - the function to run
	 * @returns {Promise<any>} - resolves with the result of the function
	 */
	async run(func){
		let unlock = await this.lock()
		try{
  			let returnValue = await func()
			await unlock()
			return returnValue
		}catch(e){
			await unlock()
			throw e
		}
	}
	
}

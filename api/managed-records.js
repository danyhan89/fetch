import fetch from "../util/fetch-fill";
import URI from "urijs";

window.path = 'http://localhost:3000/records';

const DEFAULT_OPTIONS = {
	page: 1,
	colors: [],
}
const ITEMS_PER_PAGE = 10;

const PRIMARY_COLORS = ['red','yellow','blue'];

const isPrimary = function(colorObj){
	let color = colorObj.color.toLowerCase();
	return PRIMARY_COLORS.indexOf(color) != -1;
}

const validateOptions = function(options){
	if(isNaN(options.page))
		options.page = 1;

	if(options.page < 1)
		options.page = 1;
	
	if(!(options.colors instanceof Array))
		if(typeof options.colors === 'string')
			options.colors = [options.colors];
		else
			options.colors = [];
			//throw new Error('Colors option needs to be an array or string.');
}

const constructUrl = function(options ={}){
	return URI(window.path)
						.search({
							limit: ITEMS_PER_PAGE + 1,
							offset: ITEMS_PER_PAGE * (options.page - 1),
							'color[]': options.colors.map(color=>color.toLowerCase())
						}).toString();

}

const retrieve = function(options = {}){

	options = Object.assign({},DEFAULT_OPTIONS,options);
	validateOptions(options);

	let url = constructUrl(options);
	return fetch(url)
		.then(response => {
			if(response.ok){
				return response.json();
			}
			else {
				return Response.reject(response);
			}
		})
		.then(data => {
			let hasNextPage = false;
			if(data.length > ITEMS_PER_PAGE){
				data.splice(ITEMS_PER_PAGE);
				hasNextPage = true;
			}

			let ids = data.map(item=>item.id);
			let open = data.filter(item=>item.disposition === 'open')
									.map(item =>{
										let objClone = Object.assign({},item);
										objClone.isPrimary = isPrimary(objClone);
										return objClone;
									});
			let closedPrimaryCount = data.filter(item => item.disposition === 'closed' && isPrimary(item)).length;

			let previousPage =  options.page == 1 ? null : options.page-1;
			let nextPage = hasNextPage ? options.page + 1 : null;

			return {
				ids,
				open,
				closedPrimaryCount,
				previousPage,
				nextPage,
			}
		})
		.catch(response=>{
				console.log("Error occured when fetching data",response)
		});
}

export default retrieve;




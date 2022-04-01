import { JSONGraphParserUtils } from "../../../../utils/JSONGraphParserUtils";

export const WeightedViewService = {

    * fetchWeightedDecomposition(weights: any, jsonGraph: any): Generator<any, any, any> {
        let isError = false;

        let serverName = "http://127.0.0.1:5000/7epDemo";
        Object.keys(weights).forEach((key) => {
            serverName = serverName + `/${weights[key]}`;
        })

        return yield fetch(serverName, {
			method: "POST",
			// headers: {
			// 	'Content-Type': 'application/json',
			// 	"Access-Control-Allow-Origin": "http://localhost:3000",
			// 	"Access-Control-Allow-Methods": "POST, GET, OPTIONS",
			// 	"Access-Control-Allow-Headers":  "Origin, X-Requested-With, Content-Type, Accept"
			// },
			body: JSON.stringify(jsonGraph)
		})
			.then(response => {
				isError = response.status !== 200;
				return response;
			})
			.then(response => response.json())
			.then(json => {
				if (isError) {
					throw new Error(json.error);
				}
				return {elements: new JSONGraphParserUtils().getDecomposition(json, Object.keys(jsonGraph).length + 1).getCytoscapeData()};
			});
	}
}
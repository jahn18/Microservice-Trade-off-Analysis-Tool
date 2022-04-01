import { JSONGraphParserUtils } from "../../../../utils/JSONGraphParserUtils";

export const CustomViewService = {

    * clusterGraph(graph: any): Generator<any, any, any> {
        let isError = false;

        let serverName = "http://127.0.0.1:5000/ex/cluster";
        return yield fetch(serverName, {
            method: "POST",
            body: JSON.stringify(graph)
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
                return {elements: new JSONGraphParserUtils().getDecomposition(json, Object.keys(graph).length + 1).getCytoscapeData()};
            });
    },

    * computeDependencyGraph(): Generator<any, any, any> {
        return; 
    }
}
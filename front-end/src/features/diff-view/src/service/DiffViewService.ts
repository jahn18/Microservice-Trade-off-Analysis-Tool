import { JSONGraphParserUtils } from "../../../../utils/JSONGraphParserUtils";

export const DiffViewService = {

    * fetchDiffWeightedDecomposition(jsonGraph: any): Generator<any, any, any> {
        let isError = false;

        let serverName = "http://127.0.0.1:5000/diff";

        return yield fetch(serverName, {
            method: "POST",
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
                return json;
                // return {elements: new JSONGraphParserUtils().getDecomposition(json, Object.keys(jsonGraph).length + 1).getCytoscapeData()};
            });
    }
}
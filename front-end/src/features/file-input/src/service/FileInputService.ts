export const FileInputService = {
    
    * fetchDemoDecomposition(projectName: string): Generator<any, any, any> {
        let isError = false;

        let serverName = `http://svresessp1.ece.ubc.ca/api/${projectName}`;

        return yield fetch(serverName, {
            method: "POST",
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
			});
    }
}
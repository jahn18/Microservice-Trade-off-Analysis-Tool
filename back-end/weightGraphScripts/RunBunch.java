import java.io.*;
import java.lang.reflect.*;
import java.util.*;

import bunch.*;
import bunch.api.*;
import bunch.engine.*;
import com.sun.xml.internal.bind.v2.runtime.unmarshaller.XsiNilLoader;

public class RunBunch {

	public static void main(String[] args) throws Exception {
		ArrayList<ArrayList<String>> arr = new ArrayList<ArrayList<String>>();
//		runBunch("/Users/johnahn/Research/2021_microservice_tradeoff/app-data/efgs-federation-gateway/class-names/efgs-federation-gatewayClassNameGraph.mdg", "", arr);
		for(int i = 0; i < 20; i++) {
			System.out.println("Experiment " + (i + 1));
			runBunch("/Users/johnahn/Research/2021_microservice_tradeoff/app-data/efgs-federation-gateway/class-names/efgs-federation-gatewayClassNameGraph.mdg", "", arr);
		}
		try {
			FileWriter myWriter = new FileWriter("results.csv");
			for(ArrayList<String> a : arr) {
				System.out.println(a);
				myWriter.write(Arrays.toString(a.toArray()).replace("[", "").replace("]", "") + "\n");
			}
			myWriter.close();
		} catch (IOException e) {
			e.printStackTrace();
		}
	}

	public static void runBunch(String fileName, String dest, ArrayList<ArrayList<String>> resultList) throws Exception {
		BunchAPI api = new BunchAPI();
		BunchProperties bp = new BunchProperties();

		bp.setProperty(BunchProperties.MDG_INPUT_FILE_NAME, fileName);
		bp.setProperty(BunchProperties.OUTPUT_FORMAT, BunchProperties.TEXT_OUTPUT_FORMAT);
		bp.setProperty(BunchProperties.OUTPUT_DIRECTORY, dest);
		bp.setProperty(BunchProperties.MQ_CALCULATOR_CLASS, "bunch.TurboMQ");
		bp.setProperty(BunchProperties.ECHO_RESULTS_TO_CONSOLE, "False");
		//added
		bp.setProperty(BunchProperties.MDG_OUTPUT_MODE, BunchProperties.OUTPUT_DETAILED);
//		bp.setProperty(BunchProperties.ALG_HC_SA_CLASS,"bunch.SASimpleTechnique");
//		bp.setProperty(BunchProperties.ALG_HC_SA_CONFIG,"InitialTemp=100.0,Alpha=0.95");
		//select 200 intial partitions and perform bunch on each of them, selecting the result w/ the highest MQ value
		bp.setProperty(BunchProperties.ALG_HC_POPULATION_SZ, "1000");
		bp.setProperty(BunchProperties.ALG_HC_HC_PCT, "100");
		//examine half of all possible neighbor partitions
//		bp.setProperty(BunchProperties.ALG_HC_RND_PCT,"100");

		api.setProperties(bp);
		api.run();

		System.out.println("Results: ");
		Hashtable results = api.getResults();
		printResults(results, resultList);

		BunchEngine engine = null;
		Field field = api.getClass().getDeclaredField("engine");
		field.setAccessible(true);
		engine = (BunchEngine) field.get(api);

		GraphOutput graphOutput = new GraphOutputFactory().getOutput("Text");
		graphOutput.setBaseName(fileName);
		graphOutput.setBasicName(fileName);
		String outputFileName = graphOutput.getBaseName();
		String outputPath = dest;
		if (outputPath != null) {
			File f = new File(graphOutput.getBaseName());
			String filename = f.getName();
			outputFileName = outputPath + filename;
		}
		graphOutput.setCurrentName(outputFileName);
		graphOutput.setOutputTechnique(3);
		graphOutput.setGraph(engine.getBestGraph());
		graphOutput.write();
	}

      public static void printResults(Hashtable results, ArrayList<ArrayList<String>> arr)
    {
    	ArrayList<String> temp = new ArrayList<>();

        String rt = (String)results.get(BunchAPI.RUNTIME);
        String evals = (String)results.get(BunchAPI.MQEVALUATIONS);
        String levels = (String)results.get(BunchAPI.TOTAL_CLUSTER_LEVELS);
        String saMovesTaken = (String)results.get(BunchAPI.SA_NEIGHBORS_TAKEN);
        String initialPop = (String)results.get(BunchProperties.ALG_HC_POPULATION_SZ);

        System.out.println("Runtime = " + rt + " ms.");
        System.out.println("Total MQ Evaluations = " + evals);
        System.out.println("Simulated Annealing Moves Taken = " + saMovesTaken);
        System.out.println("Total number of initial population size = " + initialPop);
        Hashtable [] resultLevels = (Hashtable[])results.get(BunchAPI.RESULT_CLUSTER_OBJS);

        temp.add(rt);
        temp.add(evals);
        temp.add(saMovesTaken);
//        temp.add(initialPop);

        for(int i = 0; i < resultLevels.length; i++)
        {
            Hashtable lvlResults = resultLevels[i];
            System.out.println("***** LEVEL "+i+"*****");
            String mq = (String)lvlResults.get(BunchAPI.MQVALUE);
            String depth = (String)lvlResults.get(BunchAPI.CLUSTER_DEPTH);
            String numC = (String)lvlResults.get(BunchAPI.NUMBER_CLUSTERS);

            System.out.println("  MQ Value = " + mq);
            System.out.println("  Best Cluster Depth = " + depth);
            System.out.println("  Number of Clusters in Best Partition = " + numC);
			temp.add(mq);
			temp.add(numC);
			System.out.println();
        }

        arr.add(temp);
    }
}

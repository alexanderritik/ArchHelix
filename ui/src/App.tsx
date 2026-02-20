import { Box, Grommet } from 'grommet';
import { theme } from './config'
import { FailedScreen, LaunchScreen, MainPage, TopBar } from './pages';
import { useSelector } from 'react-redux';
import { processGraphData } from './utils/graphUtils';
import { useEffect, useState } from 'react';
const App = () => {

  // this will keep loader active until the data is fetched or if there is an error
  const [loadingStatus, setLoadingStatus] = useState(true);

  // this will display error message screen if there is an error
  const [failedStatus, setFailedStatus] = useState(false);

  useEffect(() => {
    // Simulate network delay and fetch project structure from backend
    setTimeout(async () => {

      let structureData = [];
      let graphData = { Nodes: [], Edges: [] };
      try {
        const [structRes, graphRes] = await Promise.all([
          fetch("http://localhost:8080/api/structure"),
          fetch("http://localhost:8080/api/graph")
        ]);

        if (structRes.ok) {
          structureData = await structRes.json();
          console.log("Fetched structure data:", structureData);
        } else {
          console.error("Failed to fetch structure data", structRes.statusText);
        }

        if (graphRes.ok) {
          graphData = await graphRes.json();
          console.log("Fetched graph data:", graphData);
        } else {
          console.error("Failed to fetch graph data", graphRes.statusText);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
      }

      processGraphData(graphData, structureData);
    }, 500);

    // Provide a no-op cleanup
    return () => { };
  }, []);

  const nodesAndEdges = useSelector((state: any) => state.nodesAndEdges);
  useEffect(() => {
    if (nodesAndEdges.initialNodes.length !== undefined && nodesAndEdges.initialNodes.length > 0) {
      setLoadingStatus(false);
    } else if (nodesAndEdges.error !== '') {
      setLoadingStatus(false);
      setFailedStatus(true);
    }
  }, [nodesAndEdges]);


  return (
    <Grommet theme={theme} >
      <Box>
        {loadingStatus && <LaunchScreen />}
        {!loadingStatus && !failedStatus && <TopBar></TopBar>}
        {failedStatus && <FailedScreen message={nodesAndEdges.error} />}
        <MainPage></MainPage>
      </Box>
    </Grommet>
  );
}

export default App;

import './App.css';
import Graph from "react-graph-vis";
import React, { useState } from "react";
import ApiUtil from './Utils/ApiUtil';
import HttpUtil from './Utils/HttpUtil';
//import './network.css'

function App() {

  const [structureState, setStructureState] = useState(
    [] // 文字版
  );

  const [graphState, setGraphState] = useState(
    {
      nodes: [],
      edges: []
    }
  );

  const options = {
    layout: {
      hierarchical: false
    },
    edges: {
      color: "#34495e"
    }
  };

  const clearState = () => {
    setStructureState([]);
    setGraphState({
      nodes: [],
      edges: []
    })
  };

  const updateStructure = (update) =>{
    //setStructureState([]); //清理状态值
    //console.log(JSON.parse(JSON.stringify(structureState)));
    var current_structure = JSON.parse(JSON.stringify(structureState));
    if (update.length === 0) {
      console.log("0 output")
      return;
    }

    update.forEach(ut => {
      current_structure.push(ut);
    });
    setStructureState(current_structure);
  }

  const getColorS = () => {
    var Arr = ["#606f65", "#A79A89", "#91AD9E", "#74646d", "#826e5f", "#79606a"];  
    var n = Math.floor(Math.random() * Arr.length + 1)-1;
    return Arr[n];
  }

  const getColorO = () => {
    var Arr = ["#c4c2bf", "#ada28d", "#f7eed0", "#9a9489", "#89787c", "#bcc2d4"];  
    var n = Math.floor(Math.random() * Arr.length + 1)-1;
    return Arr[n];
  }

  const updateGraph = (updates, task) => {
    // updates will be provided as a list of lists
    // each list will be of the form [ENTITY1, RELATION, ENTITY2] or [ENTITY1, COLOR]

    var current_graph = JSON.parse(JSON.stringify(graphState));

    if (updates.length === 0) {
      return;
    }

    // check type of first element in updates
    if (typeof updates[0] === "string") {
      // updates is a list of strings
      updates = [updates]
    }

    if (task === "RE"){
      updates.forEach(update => {
        if (update.length === 3) {
          // update the current graph with a new relation
          const [entity1, relation, entity2] = update;
  
          // check if the nodes already exist
          var node1 = current_graph.nodes.find(node => node.id === entity1);
          var node2 = current_graph.nodes.find(node => node.id === entity2);
  
          if (node1 === undefined) {
            current_graph.nodes.push({ id: entity1, label: entity1, color: getColorS() });
          }
  
          if (node2 === undefined) {
            current_graph.nodes.push({ id: entity2, label: entity2, color: getColorO() });
          }
  
          // check if an edge between the two nodes already exists and if so, update the label
          // 图不支持一对结点多个边。
          var edge = current_graph.edges.find(edge => edge.from === entity1 && edge.to === entity2);
          if (edge !== undefined) {
            edge.label = relation;
            return;
          }
  
          current_graph.edges.push({ from: entity1, to: entity2, label: relation });
  
        }
      });
    } else if (task === "NER"){
      updates.forEach(update => {
        if (update.length === 2) {
          // update the current graph with a new relation
          const [entity, etype] = update;

          const enet = etype+": "+entity;
  
          // check if the nodes already exist
          var node1 = current_graph.nodes.find(node => node.id === enet);
  
          if (node1 === undefined) {
            current_graph.nodes.push({ id: enet, label: enet, color: getColorS()});
          }
  
        }
      });
    }else if (task === "EE"){
      updates.forEach( update => {
        Object.keys(update).forEach(key1 => {
        
          // check if the nodes already exist
          var node1 = current_graph.nodes.find(node => node.id === key1);
  
          if (node1 === undefined) {
            current_graph.nodes.push({ id: key1, label: key1, color: getColorS() });
          }

          const update2 = update[key1];

          Object.keys(update2).forEach(key2 => {
            const value2 = update2[key2];
            // check if the nodes already exist
            var node1 = current_graph.nodes.find(node => node.id === value2);
    
            if (node1 === undefined) {
              current_graph.nodes.push({ id: value2, label: value2, color: getColorO() });
            }
            
            // check if an edge between the two nodes already exists and if so, update the label
            // 图不支持一对结点多个边。
            var edge = current_graph.edges.find(edge => edge.from === key1 && edge.to === value2);
            if (edge !== undefined) {
              edge.label = key2;
              return;
            }
    
            current_graph.edges.push({ from: key1, to: value2, label: key2 });
          });  
        });

      });
    }
    
    //console.log(current_graph);
    setGraphState(current_graph);
  };



  const queryPrompt = (f2b) => {
    console.log(f2b);
    HttpUtil.post(ApiUtil.API_STAFF_UPDATE, JSON.stringify(f2b)).then(
      re => {
        console.log(re);
        var update = re['result'];
        console.log(update);
        console.log(update[0]);
        // 图版
        if (typeof update[0] !== "string") { //后端如果没结果或者错误的字符串
          updateGraph(update, re['task']);
        }
        // 文字版输出
        var str_update = [];
        update.forEach(ut => {
          str_update.push(JSON.stringify(ut));
        });
        console.log(str_update);
        console.log(str_update[0]);
        updateStructure(str_update);

        document.body.style.cursor = 'default';
        document.getElementsByClassName("generateButton")[0].disabled = false;
      }
    ).catch((error) => {
      console.log(error);
      alert(error);
      document.body.style.cursor = 'default';
      document.getElementsByClassName("generateButton")[0].disabled = false; //出错则释放，为了能再次使用
    }); 
    
  }


  const createIE = () => {
    document.body.style.cursor = 'wait';
    document.getElementsByClassName("generateButton")[0].disabled = true;

    const prompt = document.getElementsByClassName("searchBar")[0].value;
    const prompt1 = document.getElementById("prompt1").value;
    var access = "";
    //console.log(apiKey);
    if (prompt.length === 0){
      alert('empty sentence');
      document.body.style.cursor = 'default';
      document.getElementsByClassName("generateButton")[0].disabled = false;
      return
    }

    var f2b = {
      "sentence": prompt,
      "type": prompt1,
      "access": access,
      "task": taskState.taskValue,
      "lang": lanState.lanValue,
    }
        

    queryPrompt(f2b);
  }

  const lists = structureState.map((triplet) =>
    <li key={triplet.toString()}> {triplet}</li>
  );

  // 语言选项
  const [lanState, setLanState] = useState(
    {lanValue: "chinese"}
  );

  const handleChange = (event) => {
    console.log(event);
    console.log(event.target.value);
    //setLanState({lanValue: event.target.value}, 
    //  () => {console.log(lanState)});
    setLanState({lanValue: event.target.value}); // 坑：set状态后，lanState值不会立即改变，因为react是渲染周期结束后才更新值。
  };

  // 任务选项
  const [taskState, setTaskState] = useState(
    {taskValue: "NER"}
  );

  const handleChange2 = (event) => {
    console.log(event);
    console.log(event.target.value);
    //setLanState({lanValue: event.target.value}, 
    //  () => {console.log(lanState)});
    setTaskState({taskValue: event.target.value}); 
  };

  // <form>能控制radio为一组。
  return (
    <div className='container'>
    <p className='subheaderText'></p>
      <p className='subheaderText'>利用大模型从原始句子中提取结构化信息，并对输入句子进行有价值的领域深入分析:</p>
      <div>
      <table>
      <tbody>
      <tr>
          <td>RE</td>
          <td>entity-relation joint extraction</td>
      </tr>
      <tr>
          <td>NER</td>
          <td>named entity recoginzation</td>
      </tr>
      <tr>
          <td>EE</td>
          <td>event extraction</td>
      </tr>
      </tbody>
      </table>
      </div>
      <center>
        <div>
        <form>
        <input type="radio" id="zh" value="chinese" checked={lanState.lanValue === 'chinese'}
        onChange={handleChange} /> 中文
          <input type="radio" id="en" value="english" checked={lanState.lanValue === 'english'}
        onChange={handleChange} /> 英文
        </form>
        </div>
        <div>
        <form>
        <input type="radio" id="re" value="RE" checked={taskState.taskValue === 'RE'} 
        onChange={handleChange2} /> RE
        <input type="radio" id="ner" value="NER" checked={taskState.taskValue === 'NER'} 
        onChange={handleChange2} /> NER
        <input type="radio" id="ee" value="EE" checked={taskState.taskValue === 'EE'} 
        onChange={handleChange2} /> EE
        </form>
        </div>
        <div className='inputContainer'>
          <input className="searchBar" placeholder="请输入句子..."></input>
          <input className="typeList" id="prompt1" placeholder="可选项,类型列表: re/ner/ee ;
          eg: {“歌手”:[’歌曲‘,‘人物]}/ [' 地点 '] /{“演唱会”:[‘人物’,‘时间’,‘地方’]}，"></input>
          <button className="generateButton" onClick={createIE}>提 交</button>
          <button className="clearButton" onClick={clearState}>清 除</button>
        </div>
      </center>
      <div className='graphContainer'>
        <Graph graph={graphState} options={options} style={{ height: "640px" }} />
      </div>
      <div className='graphContainer'>
        <ul className='ulC'>{lists}</ul>
      </div>
      <p className='footer'>Tip: you can clear output by clicking Clear button for aesthetics
      <br></br>Note: Except for the mandatory "Input sentence", other items can be optional.
      <br></br>We set the default relation/entity/event type list; subject type list; object type list. Change the default setting and extract specific information by reset the type lists.</p>
    </div>
  );
}

export default App;

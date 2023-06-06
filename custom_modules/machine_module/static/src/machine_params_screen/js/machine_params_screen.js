/** @odoo-module **/
import { registry } from '@web/core/registry';
const { Component, useState, onWillStart } = owl;
import { useService } from "@web/core/utils/hooks";

export class MachineParams extends Component {
  setup() {
    this.state = useState({
      machinesList: [],
      macRoute: [],
      selectedId: null,
      machineRouteNames: [],
      paramInputValue: "",
      machineTypeParamList: [], //machineTypeParamList state
      currentMachineId: null,
    });
    this.orm = useService("orm");
    onWillStart(async () => {
      this.state.machinesList = await this.orm.searchRead("machine.details", [], ["id", "subMachines", "nameOfMachines"]);
      this.state.macRoute = await this.orm.searchRead("machine.data", [], ["id", "machineRoute"]);
      this.state.machineTypeParamList= []
      this.retrieveSelectedIdForParams();
      this.initializeMachineTypeParamList(); // function
      this.setParams(); // function
    });
    this.state.notification =useService("notification");
    this.retrieveSelectedIdForParams = this.retrieveSelectedIdForParams.bind(this);
    this.updateParamInputValue = this.updateParamInputValue.bind(this);
    this.saveParams = this.saveParams.bind(this);
    this.generateRandomNumber = this.generateRandomNumber.bind(this);
  }

  retrieveSelectedIdForParams() {
    const url = new URL(window.location.href);
    const selectedIdForRoute = url.searchParams.get("selectedIdForRoute");
    this.state.selectedId = parseInt(selectedIdForRoute);
    console.log('selectedIdForParams: ', this.state.selectedId);
    this.logMachineRoute();
  }


logMachineRoute() {

  const machineData = this.state.macRoute.find(data => data.id === this.state.selectedId);
  console.log(machineData.machineRoute==false);
  if(machineData.machineRoute==false){
  this.state.notification.add("You have not selected Machine Route. Go back and Select Machine Route First", {
          title: "Warning",
          type: "warning",
        });
        setTimeout(() => {
          window.location.href = "/web#action=machine_module.ppc_plan_view_js";
        }, 1500);
  }else{
  if (machineData) {
    const machineRouteArray = machineData.machineRoute.split(',');
    this.state.machineRouteNames = machineRouteArray.map(id => {
      const machine = this.state.machinesList.find(machine => machine.id === parseInt(id));
      return machine ? { machineId: machine.id, machineData: { nameOfMachines: machine.nameOfMachines, subMachines: machine.subMachines } } : {};
    });
    console.log('Machine Route Names: ', this.state.machineRouteNames);
    this.state.machineTypeParamList = this.state.machineRouteNames.map(machineRoute => {
      return {
        machineType: machineRoute.machineData.nameOfMachines,
        paramList: [], // Initialize an empty paramList for each machineType
      };
    });
  }
  }
}

   initializeMachineTypeParamList() {
    this.state.machineTypeParamList = [
    {machineType: "unrolling",
     paramsList: ["speed","flamePressure","Cone"]
    },
    {machineType: "sienging",
     paramsList: ["speed", "brushing1", "brushing2", "brushing3"]
    },
    {machineType: "raising",
     paramsList: ["speed","rotationTime","positionBurner"]
    },
    {machineType: "lbox",
     paramsList: ["speed","rotationTime", "flamePressure", "fabricTemp"]
    },
    {machineType: "mercerizing",
     paramsList: ["speed","rotationTime","width", "flamePressure" ]
    },
    {machineType: "curing",
     paramsList: ["speed","rotationTime","positionBurner", "fabricTemp"]
    },
    {machineType: "laffer",
     paramsList: ["speed","rotationTime","positionBurner", "brushing1", "brushing2", "brushing3", "chemicalTemp", "width", "fabricTemp"]
    },
    {machineType: "danti",
     paramsList: ["speed","rotationTime","positionBurner", "chemicalTemp", "width"]
    },
    {machineType: "suckermuler",
     paramsList: ["speed","rotationTime","positionBurner", "chemicalTemp", "flamePressure"]
    },
    ];
    console.log("Lists: ", this.state.machineTypeParamList)
  }
setParams() {
  console.log("Set Param Function");
  const matchedParamsLists = [];
  this.state.machineRouteNames.forEach(machineRoute => {
    const currentMachineType = machineRoute.machineData.nameOfMachines || "";
    console.log("Current Machine Type:", currentMachineType);
    const matchedParamsList = this.state.machineTypeParamList.find(machineType => machineType.machineType === currentMachineType)?.paramsList || [];

    if (matchedParamsList.length > 0) {
      console.log("Params List for", currentMachineType + ":", matchedParamsList);
      matchedParamsLists.push({ machineType: currentMachineType, paramsList: matchedParamsList });
    } else {
      console.log("No matching params list found for", currentMachineType);
    }
  });

  console.log("All Matched Params Lists:", matchedParamsLists);
}


//saveParams(event) {
//  const machineId = event.target.getAttribute("machine-id");
//  const machineName = event.target.getAttribute("machine-name");
//  const subMachines = event.target.getAttribute("sub-machines");
//  console.log("Machine ID:", machineId, " Machine Name:", machineName, " Sub Machines:", subMachines);
//
//  const paramInputs = event.target.parentNode.getElementsByClassName("param-input");
//  let isEmpty = false;
//  const paramsData = {
//    machineId: machineId,
//    machineType: machineName,
//    machineName: subMachines
//  };
//
//  for (const input of paramInputs) {
//    if (!input.value) {
//      isEmpty = true;
//      break;
//    }
//    const paramName = input.getAttribute("data-param-name") || input.name;
//    const paramValue = input.value;
//    paramsData[paramName] = paramValue;
//  }
//
//  if (isEmpty) {
//    console.log("Some input fields are empty.");
//    this.state.notification.add("Some input fields are empty.", {
//      title: "Warning",
//      type: "warning",
//    });
//  } else {
//    console.log("Input data:", paramsData);
//    this.orm.create("machine.params", [paramsData])
//      .then(() => {
//        console.log("Data saved successfully.");
//        this.state.notification.add("All input fields are filled.", {
//          title: "Success",
//          type: "success",
//        });
//      })
//      .catch((error) => {
//      this.state.notification.add("Error saving data.", {
//          title: "Warning",
//          type: "warning",
//        });
//        console.error("Error saving data:", error);
//      });
//  }
//}


saveParams(event) {
  const machineId = event.target.getAttribute("machine-id");
  const machineName = event.target.getAttribute("machine-name");
  const subMachines = event.target.getAttribute("sub-machines");
  console.log("Machine ID:", machineId, " Machine Name:", machineName, " Sub Machines:", subMachines);

  const paramInputs = event.target.parentNode.getElementsByClassName("param-input");
  let isEmpty = false;
  const paramsData = {
    machineId: machineId,
    machineType: machineName,
    machineName: subMachines
  };

  for (const input of paramInputs) {
    if (!input.value) {
      isEmpty = true;
      break;
    }
    const paramName = input.getAttribute("data-param-name") || input.name;
    const paramValue = input.value;
    paramsData[paramName] = paramValue;
  }

  if (isEmpty) {
    console.log("Some input fields are empty.");
    this.state.notification.add("Some input fields are empty.", {
      title: "Warning",
      type: "warning",
    });
  } else {
    console.log("Input data:", paramsData);
    this.orm.create("machine.params", [paramsData])
      .then(() => {
        console.log("Data saved successfully.");
        this.state.notification.add("All input fields are filled.", {
          title: "Success",
          type: "success",
        });

        // Empty the input fields
        for (const input of paramInputs) {
          input.value = "";
        }
      })
      .catch((error) => {
        this.state.notification.add("Error saving data.", {
          title: "Warning",
          type: "warning",
        });
        console.error("Error saving data:", error);
      });
  }
}



generateRandomNumber() {
    const randomNum = Math.floor(Math.random() * 10000000);
//    console.log("Random: ", randomNum);
    return randomNum;
}


  updateParamInputValue(event) {
    this.state.paramInputValue = event.target.value;
  }
  saveParam(event) {
    try {
      const paramValue = this.state.paramInputValue;
      this.orm.create("machine.params", [{ Cone: paramValue }]);
      this.state.paramInputValue = ""; // Reset the input field value
      console.log('Value Sent');
    } catch (error) {
      console.error("Error saving param:", error);
    }
  }
}

MachineParams.template = 'machine_module.MachineParams';
registry.category('actions').add('machine_module.machine_params_screen_js', MachineParams);

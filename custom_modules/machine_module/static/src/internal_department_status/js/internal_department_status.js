/** @odoo-module **/
import { registry } from '@web/core/registry';
const { Component, useState, onWillStart } = owl;
import { useService } from "@web/core/utils/hooks";

export class DepartmentStatus extends Component{
    setup(){
        this.state = useState({
            departmentList:[],
            departmentArrays: [],
        });
        this.orm = useService("orm");
        onWillStart(async()=>{
            this.state.departmentList = await this.orm.searchRead("machine.data", [], ["id" , "departmentNames", "ppLotNum", "shade", "contract"]);
            const departmentTypes = new Set(this.state.departmentList.map(plan => plan.departmentNames));
            const departmentArrays = [];
            for (const departmentNames of departmentTypes) {
                if (departmentNames === false) {
                    continue;
                }
                const departmentTypeData = this.state.departmentList.filter(plan => plan.departmentNames === departmentNames);
                const departmentTypeObject = {
                    type: departmentNames,
                    data: departmentTypeData,
                };
                departmentArrays.push(departmentTypeObject);
            }
            this.state.departmentArrays = departmentArrays;
        });
        this.redirectToRoutingScreen = this.redirectToRoutingScreen.bind(this);
    }
    redirectToRoutingScreen() {
       window.location.href = "/web#action=machine_module.ppc_plan_view_js";
    }
}
DepartmentStatus.template = 'machine_module.departmentStatus';
registry.category('actions').add('machine_module.department_status_screen_js', DepartmentStatus);



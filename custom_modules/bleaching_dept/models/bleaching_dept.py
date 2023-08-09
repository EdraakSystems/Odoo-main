from odoo import models, fields, api, registry, SUPERUSER_ID, sql_db, http, tools
import json, odoo, uuid, time, openpyxl,  io


class PpcOrderView(http.Controller):
    @http.route('/api/ppc_order_view/get_model_fields', type='http', auth='user', methods=['POST'], csrf=False)
    def get_model_fields(self, **kw):
        try:
            model = http.request.env['order.data']
            fields = model.fields_get()
            return http.Response(json.dumps({'fields': fields}), content_type='application/json')
        except Exception as e:
            return http.Response(json.dumps({'error': str(e)}), content_type='application/json', status=500)


class ParamsFields(http.Controller):
    @http.route('/api/params_fields/get_model_fields', type='http', auth='user', methods=['POST'], csrf=False)
    def get_model_fields(self, **kw):
        try:
            model = http.request.env['bleaching.machines.params']
            fields = model.fields_get()
            return http.Response(json.dumps({'fields': fields}), content_type='application/json')
        except Exception as e:
            return http.Response(json.dumps({'error': str(e)}), content_type='application/json', status=500)


class RecipeFields(http.Controller):
    @http.route('/api/recipe_fields/get_model_fields', type='http', auth='user', methods=['POST'], csrf=False)
    def get_model_fields(self, **kw):
        try:
            model = http.request.env['bleaching.machines.recipe']
            fields = model.fields_get()
            return http.Response(json.dumps({'fields': fields}), content_type='application/json')
        except Exception as e:
            return http.Response(json.dumps({'error': str(e)}), content_type='application/json', status=500)

class BleachingDept(models.Model):
    _name = "bleaching.dept"
    _inherit = ["mail.thread", "mail.activity.mixin"]
    _description = "Bleaching Dept"

    ppLot = fields.Integer(string='PP Lot Number')


class BleachingMachineTypes(models.Model):
    _name = "bleaching_machine.types"
    _inherit = ["mail.thread", "mail.activity.mixin"]
    _description = "Bleaching Dept Machine Types"

    machine_type_name = fields.Char(string='Machine Type Name')
    machineParams = fields.Char(string='Machine Params')
    machineRecipes = fields.Char(string='Machine Params')

    def name_get(self):
        result = []
        for record in self:
            name = record.machine_type_name
            result.append((record.id, name))
        return result


class BleachingMachines(models.Model):
    _name = "bleaching.machines"
    _inherit = ["mail.thread", "mail.activity.mixin"]
    _description = "Bleaching Dept Machines"

    machine_type = fields.Many2one('bleaching_machine.types', string='Machine Type', required=True, create=False)
    machine_name = fields.Char(string='Machine Name')
    underMaintenance = fields.Boolean(string='Machine Under Maintenance', default=False)


class MachineRoute(models.Model):
    _name = 'machine.routing'
    _inherit = ["mail.thread", "mail.activity.mixin"]
    _description = "Machine Routes"

    orderId = fields.Integer(string='OrderId')
    route_name = fields.Char(string='Machine Route Name')
    machineId = fields.Integer(string='Machine Id')
    delay = fields.Integer(string='Delay value')
    status = fields.Char(string='Machine Status')


class BleachingMachineParams(models.Model):
    _name = "bleaching.machines.params"
    _inherit = ["mail.thread", "mail.activity.mixin"]
    _description = "Bleaching Machine Params"

    orderId = fields.Integer(string='Order Id')
    machineId = fields.Integer(string='Machine Id')
    speed = fields.Integer(string='Speed')
    chemicalTemp = fields.Integer(string='Chemical Temperature')
    flamePressure = fields.Integer(string='Flame Pressure')
    positionBurner = fields.Integer(string='Position Burner')
    distance = fields.Integer(string='Distance')
    fabricTemp = fields.Integer(string='Fabric Temperature')
    cameraSetting = fields.Integer(string='Camera Setting')
    brushingSetting1 = fields.Integer(string='Brushing Setting 1')
    brushingSetting2 = fields.Integer(string='Brushing Setting 2')
    brushingSetting3 = fields.Integer(string='Brushing Setting 3')
    brushingSetting4 = fields.Integer(string='Brushing Setting 4')
    brushingSetting5 = fields.Integer(string='Brushing Setting 5')
    brushingSetting6 = fields.Integer(string='Brushing Setting 6')
    cone = fields.Integer(string='Cone')
    burnerFace = fields.Integer(string='Burner Face')
    burnerBack = fields.Integer(string='Burner Back')
    entryWidth = fields.Integer(string='Entry Width')
    exitWidth = fields.Integer(string='Exit Width')
    chamberTemp1 = fields.Integer(string='Chamber Temperature 1')
    chamberTemp2 = fields.Integer(string='Chamber Temperature 2')
    chamberTemp3 = fields.Integer(string='Chamber Temperature 3')
    widthBefore = fields.Integer(string='Width Before')
    widthAfter = fields.Integer(string='Width After')
    widthChain = fields.Integer(string='Width Chain')
    d_tension = fields.Integer(string='D/Tension')
    drumRPM = fields.Integer(string='Drum RPM')
    exitDeliveryBrush = fields.Integer(string='Exit Delivery Brush')
    topClearingBrushDistance = fields.Integer(string='Top Clearing Brush Distance')
    upperBrush = fields.Integer(string='Upper Brush')
    tensionWarp = fields.Integer(string='Tension Warp')
    pressureLeft = fields.Integer(string='Pressure Left')
    pressureRight = fields.Integer(string='Pressure Right')
    emery = fields.Integer(string='Emery')
    scouringTime = fields.Char(string='Scouring Time')
    bleachingTime = fields.Char(string='Bleaching Time')


class BleachingMachineRecipe(models.Model):
    _name = "bleaching.machines.recipe"
    _inherit = ["mail.thread", "mail.activity.mixin"]
    _description = "Bleaching Machine Recipe"

    orderId = fields.Integer(string='Order Id')
    machineId = fields.Integer(string='Machine Id')
    hydrogenPeroxide = fields.Integer(string='Hydrogen Peroxide(H2O2)')
    sodiumHypochlorite = fields.Integer(string='Sodium Hypochlorite(NaClO)')
    sodiumPercarbonate = fields.Integer(string='Sodium Percarbonate(2Na2CO3·3H2O2)')
    sodiumMetabisulfite = fields.Integer(string='Sodium MetabisulfiteSodium(Na2S2O5)')
    sodiumHydroxide = fields.Integer(string='Sodium Hydroxide(NaOH)')
    aceticAcid = fields.Integer(string='Acetic Acid(CH3COOH)')

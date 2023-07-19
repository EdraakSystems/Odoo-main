from odoo import models, fields, api, registry, SUPERUSER_ID, sql_db, http, tools
import json, odoo, uuid, time, openpyxl,  io


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



class BleachingMachineParams(models.Model):
    _name = "bleaching.machines.params"
    _inherit = ["mail.thread", "mail.activity.mixin"]
    _description = "Bleaching Machine Params"



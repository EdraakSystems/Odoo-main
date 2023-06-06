# from odoo import api, SUPERUSER_ID, fields

def print():
    print("I RAN")


print()
#
# def migrate(cr, version):
#     print('version : ', version)
#     if not version:
#         return
#
#     if version == '1.0':
#         # Perform the necessary schema changes for version 1.0
#         update_schema_v1(cr)
#     elif version == '2.0':
#         # Perform the necessary schema changes for version 2.0
#         update_schema_v2(cr)
#     elif version == '3.0':
#         # Perform the necessary schema changes for version 3.0
#         update_schema_v3(cr)
#     else:
#         # Handle unsupported versions or custom migrations
#         pass
#
#
# def update_schema_v1(cr):
#     # Perform the schema changes for version 1.0
#     with api.Environment.manage():
#         env = api.Environment(cr, SUPERUSER_ID, {})
#         model = env['machine.data']
#         # Perform any necessary modifications to the model or fields
#         model.field_name = fields.Char(string='New Field')
#
#
# def update_schema_v2(cr):
#     # Perform the schema changes for version 2.0
#     with api.Environment.manage():
#         env = api.Environment(cr, SUPERUSER_ID, {})
#         model = env['machine.data']
#         # Perform any necessary modifications to the model or fields
#         model.field_name = fields.Integer(string='Modified Field')
#
#
# def update_schema_v3(cr):
#     # Perform the schema changes for version 3.0
#     with api.Environment.manage():
#         env = api.Environment(cr, SUPERUSER_ID, {})
#         model = env['machine.data']
#         # Perform any necessary modifications to the model or fields
#         model.field_name = fields.Boolean(string='New Boolean Field')
#
#
# def pre_init_hook(cr):
#     # Perform any pre-installation steps or validations
#     pass
#
#
# def uninstall_hook(cr):
#     # Perform any schema changes or cleanup during module uninstallation
#     pass

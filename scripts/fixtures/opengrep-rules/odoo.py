from odoo import http
from odoo.tools.safe_eval import safe_eval
from markupsafe import Markup


class C(http.Controller):
    # ruleid: odoo-public-route-sudo
    @http.route('/p/<int:id>', auth="public")
    def a(self, id):
        return http.request.env['x'].sudo().browse(id).name

    # ruleid: odoo-public-route-sudo
    @http.route('/q/<int:id>', methods=['GET'], type='http', auth='none')
    def a2(self, id):
        a = http.request.env['x'].sudo().browse(id)
        b = http.request.env['y'].sudo().browse(id)
        return a.name, b.name

    # ok: odoo-public-route-sudo
    @http.route('/u/<int:id>', auth="user")
    def b(self, id):
        return http.request.env['x'].sudo().browse(id).name

    # ok: odoo-public-route-sudo
    @http.route('/n/<int:id>', auth="public")
    def b2(self, id):
        return http.request.env['x'].browse(id).name

    # ruleid: odoo-route-csrf-off
    @http.route('/hook', auth="none", csrf=False)
    def c(self):
        return 1

    # ok: odoo-route-csrf-off
    @http.route('/form', auth="user")
    def d(self):
        return 1


def e(name, ids):
    # ruleid: odoo-safe-eval
    safe_eval(name)
    # ok: odoo-safe-eval
    return ids


def m(name):
    # ruleid: odoo-markup-fstring
    a = Markup(f"<b>{name}</b>")
    # ok: odoo-markup-fstring
    b = Markup("<b>%s</b>") % name
    return a, b

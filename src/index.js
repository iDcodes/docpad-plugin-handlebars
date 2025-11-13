// @ts-nocheck
'use strict'

// External
const BasePlugin = require('docpad-baseplugin')
const Handlebars = require('handlebars')

/**
 * Handlebars Plugin for DocPad (modern ES6 version)
 * Compatible with DocPad 8
 */
class HandlebarsPlugin extends BasePlugin {
	get name() {
		return 'handlebars'
	}

	get initialConfig() {
		return {
			precompileOpts: {},
			helpers: {},
			partials: {}
		}
	}

	/**
	 * Called when DocPad is ready — initialize Handlebars, helpers, and partials.
	 */
	docpadReady(opts, next) {
		const { docpad } = this
		const config = this.getConfig()

		docpad.log('info', '[HandlebarsPlugin] Initializing Handlebars...')

		this.handlebars = Handlebars
		this.precompileOpts = config.precompileOpts || {}

		// Register helpers
		if (config.helpers && typeof config.helpers === 'object') {
			Object.entries(config.helpers).forEach(([name, helper]) => {
				try {
					this.handlebars.registerHelper(name, helper)
					docpad.log('debug', `[HandlebarsPlugin] Registered helper: ${name}`)
				} catch (err) {
					docpad.log('error', `[HandlebarsPlugin] Failed to register helper: ${name}`, err)
				}
			})
		}

		// Register partials
		if (config.partials && typeof config.partials === 'object') {
			Object.entries(config.partials).forEach(([name, partial]) => {
				try {
					this.handlebars.registerPartial(name, partial)
					docpad.log('debug', `[HandlebarsPlugin] Registered partial: ${name}`)
				} catch (err) {
					docpad.log('error', `[HandlebarsPlugin] Failed to register partial: ${name}`, err)
				}
			})
		}

		docpad.log('info', '[HandlebarsPlugin] Handlebars ready.')
		next()
	}

	/**
	 * Renders Handlebars files (.hbs, .handlebars)
	 */
	render(opts, next) {
		const { inExtension, outExtension, templateData, content, file } = opts
		const { handlebars } = this

		try {
			if (['hb', 'hbs', 'handlebars'].includes(inExtension)) {
				if (['js', 'inlinejs'].includes(outExtension)) {
					opts.content = this.handlePrecompileOpts(opts)
				} else {
					const compiled = handlebars.compile(content)
					opts.content = compiled(templateData)
				}
			}
			next()
		} catch (err) {
			this.docpad.log('error', `[HandlebarsPlugin] Render error in ${file?.attributes?.relativePath || 'unknown file'}`, err)
			next(err)
		}
	}

	/**
	 * Handles Handlebars precompilation (for JS templates)
	 */
	handlePrecompileOpts(opts) {
		const argv = { ...this.precompileOpts }
		argv.wrapper ??= 'default'
		argv.amdPath ??= ''

		let pre = ''
		let post = ''

		const templateName = opts.file.attributes.slug || opts.file.attributes.basename

		if (argv.wrapper === 'amd') {
			pre += `define(['${argv.amdPath}handlebars'], function(Handlebars) {\n`
		}

		if (argv.wrapper === 'default') {
			pre += '(function() {\n'
		}

		if (['default', 'amd'].includes(argv.wrapper)) {
			pre += '  var template = Handlebars.template, templates = Handlebars.templates = Handlebars.templates || {};\n'
			pre += `  templates['${templateName}'] = template(`
			post += ');\n'
		}

		if (argv.wrapper === 'amd') post += '});'
		if (argv.wrapper === 'default') post += '})();'

		return pre + this.handlebars.precompile(opts.content) + post
	}
}

module.exports = HandlebarsPlugin

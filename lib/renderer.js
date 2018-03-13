const mermaid = require('./mermaid.min.js');
const crypto = require('crypto');
const fs = require('fs');
const puppeteer = require('puppeteer');

const reg = /(\s*)(```) *(mermaid) *\n?([\s\S]+?)\s*(\2)(\n+|$)/;
const theme = 'forest';
const config = {
	logLevel: 5,
	startOnLoad: false,
	arrowMarkerAbsolute: false,
	theme: theme,
	flowchart: {},
	sequenceDiagram: {},
	gantt: {
		titleTopMargin: 25,
		barHeight: 20,
		barGap: 4,
		topPadding: 50,
		leftPadding: 75,
		gridLineStartPadding: 35,
		fontSize: 11,
		fontFamily: '"Open-Sans", "sans-serif"',
		numberSectionStyles: 3,
		axisFormatter: [
			['%I:%M', d => d.getHours()],
			['w. %U', d => d.getDay() === 1],
			['%a %d', d => d.getDay() && d.getDate() !== 1],
			['%b %d', d => d.getDate() !== 1],
			['%m-%y', d => d.getMonth()],
		],
	},
	classDiagram: {},
	gitGraph: {},
	info: {}
}

function ignore(data) {
	var source = data.source;
	var ext = source.substring(source.lastIndexOf('.')).toLowerCase();
	return ['.js', '.css', '.html', '.htm'].indexOf(ext) > -1;
}

function getMermaidId() {
	var svgId = 'mermaid-svg-' + crypto.randomBytes(8).toString('hex');
	return svgId;
}

exports.render = async function(data) {
	if(!ignore(data)) {
		var group = data.content.match(reg);
		var content = group[4];
		var start = group[1];
		var end = group[6];
		const svgId = getMermaidId();
		try {
			const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
			const page = await browser.newPage();
			console.log(`file://${path.join(__dirname, 'index.html')}`);
			await page.goto(`file://${path.join(__dirname, 'index.html')}`);
			const result = await page.$eval('#container', (container, content, config) => {
				container.innerHTML = content;
				const mermaidAPI = window.mermaid.mermaidAPI;
				mermaidAPI.initialize(config);
				var cb = function(svgGraph) {
					console.log('render finished!');
				};
				var svgGraph = mermaidAPI.render(svgId,content,cb);
				return svgGraph;
			}, content, config);
			await fs.writeFile('./'+svgId+'.txt', result, (err) => {
				if(err) throw err;
			})
			await browser.close();
			svgGraph = fs.readFileSync('./'+svgId+'.txt', 'utf-8');
			content = start + '<div class="mermaid">\n' + svgGraph + '\n</div>' + end;
			fs.unlinkSync('./'+svgId+'.txt');
		} catch(e) {
			fs.unlinkSync('./'+svgId+'.txt');
			content = start + '<pre>' + e + '</pre>' + end;
		}
		data.content = content;
	}
}
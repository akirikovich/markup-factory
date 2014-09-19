module.exports = function(grunt) {

	var settings = grunt.file.readJSON("settings.json"),
		jadeFiles = {};

	//jade files list forming
	for(var i = 0; i < settings.pages.length; i++) {
		var curPage = settings.pages[i].code;

		jadeFiles[settings.paths.prod.pages + "/" + curPage + ".html"] = settings.paths.dev.views + "/" + curPage + ".jade";
	}
	jadeFiles[settings.paths.prod.root + "/index.html"] = settings.paths.dev.root + "/index.jade";

	grunt.initConfig({

		pkg: grunt.file.readJSON('package.json'),

		stylus: {
			main: {
	      		options: {
	          		compress: false,
	          		import: ["nib"],
	          		banner: "/**************************************************" + "\n" +
	          				"\t" + "Project '" + settings.info.name + "', " + settings.info.year + "\n" +
	          				"\t" +  "Last update: <%= grunt.template.today('dd.mm.yyyy') %>" + "\n" +
	          				"\t" +  "Author: Alexandr Kirikovich, Russia, Rostov-on-Don | www.wemakesites.ru" + "\n" +
	          				"\n" +
	          				"\t" +  "Was used: Stylus, Nib, Grunt" + "\n" +
	          				"**************************************************/\n\n"
	        	},
	        	files: {
	          		"./prod/css/dm.css": "./dev/public/css/dm.styl"
	        	}
	      	}
	    },

	    //Jade files handling
		jade: {
			views: {
	        	options: {
	          		data: function(dest, src) {

	          			var pagePath = src[0],
	          				pagePathSplit = pagePath.split("/"),
	          				pageName = pagePathSplit[pagePathSplit.length - 1].substr(0, pagePathSplit[pagePathSplit.length - 1].indexOf(".")),
	          				pageParams = {};

	          			if(pageName == "index") {
	          				pageParams = settings;
	          			} else {
	          				for(var i =0; i < settings.pages.length; i++) {
	          					if(settings.pages[i].code == pageName) {
	          						pageParams = settings.pages[i];
	          						break;
	          					}
	          				}
	          				pageParams["info"] = settings.info;
	          			}

	          			return pageParams;
	          		},
	          		pretty: true
	          	},
	          	files: jadeFiles
	       	}, 
	       	front: {
	       		options: {
	       			data: settings,
	       			pretty: true
	       		},
	       		files: {
	       			"./prod/index.html": "./dev/index.jade" 
	       		}
	       	}
	    },

	    clean: {
	    	js: {
	    		src: "./prod/js/vendor/"
	    	},
	    	fonts: {
	    		src: "./prod/fonts/"
	    	},
	    	images: {
	    		src: "./prod/i/"
	    	},
	    	upload: {
	    		src: "./prod/dummy/"
	    	}
	    },

	    copy: {
	    	// Copies robots.txt, web icons and .htaccess
	    	service: {
	    		files: [
	    			{
	    				src: "./dev/robots.txt",
	    				dest: "./prod/robots.txt"
	    			},
	    			{
	    				src: "./dev/.htaccess",
	    				dest: "./prod/.htaccess"
	    			},
	    			{
	    				src: "./dev/favicon.png",
	    				dest: "./prod/favicon.png"
	    			}
	    		]
	    	},
	    	// Copies all javascript
	    	js: {
	    		files: [
	    			{
	    				expand: true,
	    				cwd: "./dev/public/js/vendor/",
	    				src: "*.js",
	    				dest: "./prod/js/vendor/"
	    			}
	    		]
	    	},
	    	jsMain: {
	    		files: [
	    			{
	    				src: "./dev/public/js/dm.js",
	    				dest: "./prod/js/dm.js"
	    			}
	    		]
	    	},
	    	// Copies all fonts
	    	fonts: {
	    		files: [
	    			{
	    				expand: true,
	    				cwd: "./dev/public/fonts/",
	    				src: "**",
	    				dest: "./prod/fonts/"
	    			}
	    		]
	    	},
	    	// Copies all images from ./dev/public/i directory
	    	images: {
	    		files: [
	    			{
	    				expand: true,
	    				cwd: "./dev/public/i/",
	    				src: "**",
	    				dest: "./prod/i/"
	    			}
	    		]
	    	},
	    	// Copies all files from ./dev/upload directory
	    	upload: {
	    		files: [
	    			{
	    				expand: true,
	    				cwd: "./dev/dummy/",
	    				src: "**",
	    				dest: "./prod/dummy/"
	    			}
	    		]
	    	}
	    },

	    compress: {
	    	// Compress project for developer
	    	production: {
	    		options: {
	    			archive: settings.paths.prod.archives + "/" + settings.info.code + "_<%= grunt.template.today('dd-mm-yyyy') %>.zip",
	    			mode: "zip"
	    		},
	    		expand: true,
	    		cwd: settings.paths.prod.root,
	    		src: ["**", ".*"]
	    	}
	    },

	    ftp_push: {
	    	upload: {
	    		options: {
	    			host: "62.109.22.8",
	    			port: 21,
	    			authKey: "key",
	    			dest: "/"
	    		},
	    		files: [
	    			{
	    				expand: true,
	    				cwd: "./prod/",
	    				src: "**"
	    			}
	    		]
	    	},
	    	archives: {
	    		options: {
	    			host: "62.109.22.8",
	    			port: 21,
	    			authKey: "key",
	    			dest: "/archives/"
	    		},
	    		files: [
	    			{
	    				expand: true,
	    				cwd: "./archives/",
	    				src: "*.zip"
	    			}
	    		]
	    	}
	    },

	    validation: {
	    	html: {
		    	options: {
		    		stoponerror: false
		    	},
		    	files: [
		    		{
		    			src: "./prod/pages/*.html"
		    		}
		    	]
	    	}
	    },

		markdown: {
			docs: {
				files: [{
					expand: true,
					src: '*.md',
					dest: './prod/docs/',
					ext: '.html',
					cwd: "./dev/docs/"
				}]
			}
		},

	    watch: {
	    	stylus: {
	        	files: "./dev/public/css/*.styl",
	        	tasks: ["newer:stylus:main"]
	      	},
	      	jade: {
	      		files: [
	      			"./dev/views/*.jade",
	      			"./dev/lib/*.jade",
	      			"./dev/templates/*.jade",
	      			"./dev/index.jade",
	      			"./dev/pages.json"
	      		],
	        	tasks: ["jade:views"]
	      	},
	      	copy: {
	      		files: ["./dev/public/js/dm.js"],
	      		tasks: ["copy:jsMain"]
	      	},
	      	markdown: {
	      		files: ["./dev/docs/*.md"],
	      		tasks: ["newer:markdown:docs"]
	      	}
	    }
	});

	// Jade шаблонизатор
	grunt.loadNpmTasks('grunt-contrib-jade');

	// Load required modules
	/*grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-stylus');
	
	
	grunt.loadNpmTasks('grunt-contrib-compress');
	
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-contrib-clean');

	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-newer');





	grunt.loadNpmTasks('grunt-ftp-push');
	grunt.loadNpmTasks('grunt-html-validation');

	grunt.loadNpmTasks('grunt-markdown');*/

	// Task definitions

	// Создание каскада проекта
	// Пример вызова: grunt start:<name — название проекта на Русском языке>:<code — кодовое имя проекта на латинице>:<year — год разработки проекта>
	grunt.registerTask("start", "Create project structure", function(name, code, year) {
		// Если не передано ни одного аргумента
		if(arguments.length === 0) {
			return false;
		}
		// Создание раздела info
		if(!settings.info) {
			// Если по какой-то причине раздел отстуствовал, то создаём его
			settings.info = {};
		}
		// Задание имени проекта
		if(name) {
			settings.info.name = name;
		}
		// Задание кодового имени проекта
		if(code) {
			settings.info.code = code;
			settings.info.productionUrl = "http://wemakesites.ru/" + code + "/";
		}
		// Задание года разработки
		if(year) {
			settings.info.year = year;
		}

		grunt.file.write('settings.json', JSON.stringify(settings, null, "	"));
	});

	// Добавление или обновление страницы
	// Пример вызова: grunt page:<name — название страницы>:<code — кодовое имя страницы>:<progress — текущий прогресс>:<template — название шаблона>
	grunt.registerTask("page", "Add or update page", function(name, code, progress, template) {

		// Если не передано ни одного аргумента
		if(arguments.length === 0) {
			return false;
		}
		// Создание раздела pages
		if(!settings.pages) {
			settings.pages = {};
		}
		// Если страница уже существует
		if(settings.pages[code] !== undefined) {
			// Обновление название
			if(name) {
				settings.pages[code].name = name;
			}
			// Обновление прогресса выполнения
			if(progress) {
				settings.pages[code].progress = progress;
			}
			// Обновление шаблона
			if(template) {
				settings.pages[code].template = template;
			}
		} else {
		// Если страница еще не существует
			settings.pages[code] = {
				"name": name,
				"progress": progress,
				"template": template
			};
		}

		// Обновляем файл параметров
		grunt.file.write('settings.json', JSON.stringify(settings, null, "	"));

		// Запускаем задание на обновление главной страницы
		grunt.task.run("jade:front");
	});


	grunt.registerTask("production", ["copy", "jade:views", "stylus:main"]);

	grunt.registerTask("move", ["clean", "copy"]);

	grunt.registerTask("upload", ["ftp_push:upload"]);
	grunt.registerTask("deploy", ["ftp_push:upload", "ftp_push:archives"]);

	grunt.registerTask("make", ["production", "compress:production", "deploy"]);

	grunt.registerTask("assemble", "Assemple project", function() {

		var settings = grunt.file.readJSON("settings.json"),
			devPaths = settings.paths.dev,
			pages = settings.pages;

		grunt.log.subhead("Creatings directories");
		for(var k in devPaths) {

			var curPath = devPaths[k];

			if(grunt.file.isDir(curPath)) {
				grunt.log.error(curPath + " already created");
				continue;
			}

			grunt.file.mkdir(curPath);
			grunt.log.ok(curPath + " was created");
		}

		grunt.log.subhead("Generating views");
		for(var i = 0; i < pages.length; i++) {

			var curPage = pages[i],
				curFile = devPaths.views + "/" + pages[i].code + ".jade",
				curDocFile = devPaths.docs + "/" + pages[i].code + ".md";
				tmplPath = devPaths.templates + "/" + curPage.template + ".jade";
				tmplStr = "";

			if(curPage.template) {
				tmplStr = "extends ../templates/" + curPage.template
			}

			if(grunt.file.isFile(curDocFile)) {
				grunt.log.error(curDocFile + " already created");
				continue;
			} else {
				grunt.file.write(curDocFile, '');
				grunt.log.ok(curDocFile + " was created");
			}

			if(grunt.file.isFile(curFile)) {
				grunt.log.error(curFile + " already created");
				continue;
			}

			if(curPage.template) {
				if(!grunt.file.isFile(tmplPath)) {
					grunt.file.write(tmplPath);
					grunt.log.ok("New template " + tmplPath + " was created");
				} else {
					grunt.log.error("Template " + tmplPath + " already created");
				}
			}

			grunt.file.write(curFile, tmplStr);
			grunt.log.ok(curFile + " was created");
		}

		 grunt.task.run("jade:views");
		 grunt.task.run("markdown:docs");

	});

};
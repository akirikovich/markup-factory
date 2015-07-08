module.exports = function(grunt) {
	// Настройки
	var settings = grunt.file.readJSON("settings.json");
	// Список html шаблонов на компиляцию
	var jadeViews = {};
	for(var pageCode in settings.pages) {
		jadeViews[settings.paths.prod.pages + "/" + pageCode + ".html"] = settings.paths.dev.views + "/" + pageCode + ".jade";
	}
	// Главнаая страница со список сверстанных макетов
	var frontPage = {};
	frontPage[settings.paths.prod.root + "/index.html"] = settings.paths.dev.root + "/index.jade";
	// Styl файлы для компиляции
	var stylusFiles = {};
	if(grunt.file.isDir(settings.paths.dev.css)) {
		grunt.file.recurse(settings.paths.dev.css, function(abspath, rootdir, subdir, filename) {
			stylusFiles[(settings.paths.prod.css + "/" + filename.replace(".styl", ".css"))] = abspath;
		});
	}
	// Конфигурация заданий
	grunt.initConfig({
		// Компиляция стилевых файлов
		stylus: {
			main: {
	      		options: {
	          		compress: false,
	          		import: ["nib"]
	        	},
	        	files: stylusFiles
	      	}
	    },

	    // Автоматическая генерация спрайтов
    	sprite: {
    		all: {
        		src: settings.paths.dev.images + "/sprites/*.png",
        		dest: settings.paths.dev.images + "/sprite.png",
        		destCss: settings.paths.dev.css + "/sprite.styl",
        		cssTemplate: settings.paths.dev.root + "/sprite.styl.mustache",
        		padding: 20
      		}
    	},

    	// Оптимизация картинок
    	imagemin: {
    		static: {
    			options: {
    				optimizationLevel: 3
    			},
    			files: [{
    				expand: true,
    				cwd: settings.paths.dev.images,
    				src: ["*.png"],
    				dest: settings.paths.prod.images,
    				ext: ".png"
    			}]
    		}
    	},

	    // Компиляция html шаблонов
		jade: {
			// Страницы
			views: {
				// Формирование параметров для компиляции
	        	options: {
	          		data: function(dest, src) {
	          			var pagePath = src[0],
	          				pagePathSplit = pagePath.split("/"),
	          				pageName = pagePathSplit[pagePathSplit.length - 1].substr(0, pagePathSplit[pagePathSplit.length - 1].indexOf(".")),
	          				pageParams = {};
	          			if(pageName == "index") {
	          				pageParams = settings;
	          			} else {
	          				for (var code in settings.pages) {
	          					if(code == pageName) {
	          						pageParams = settings.pages[code];
	          						pageParams.code = code;
	          						break;
	          					}
	          				}
	          				pageParams["info"] = settings.info;
	          			}
	          			return pageParams;
	          		},
	          		pretty: true
	          	},
	          	files: jadeViews
	       	},
	       	// Главная страница со списком сверстанных страниц
	       	front: {
	       		options: {
	       			pretty: true,
	       			data: function(dest, src) {
	       				var archives = [];
	       				if(grunt.file.isDir(settings.paths.prod.archives)) {
							grunt.file.recurse(settings.paths.prod.archives, function(abspath, rootdir, subdir, filename) {
								archives.push({
									"name": filename,
									"path": abspath
								});
							});
	       				}
						var customSettings = settings;
						customSettings.archives = archives;

	       				return settings;
	       			}
	       		},
	       		files: frontPage
	       	}
	    },

	    // Создание архива верстки
	    compress: {
	    	production: {
	    		options: {
	    			archive: settings.paths.prod.archives + "/" + settings.info.code + "_<%= grunt.template.today('dd-mm-yyyy_HH-MM-ss') %>.zip",
	    			mode: "zip",
	    			level: 9,
	    			pretty: true
	    		},
	    		expand: true,
	    		cwd: settings.paths.prod.root,
	    		src: [
	    			"**", 
	    			".*",
	    			"!archives",
	    			"!archives/*"
	    		]
	    	}
	    },

	    // Выкладка на демонстрационный сервер
	    ftp_push: {
	    	deploy: {
	    		options: {
	    			host: "www.wemakesites.ru",
	    			port: 21,
	    			username: "projects",
	    			password: "projects-root",
	    			dest: "/" + settings.info.code
	    		},
	    		files: [
	    			{
	    				expand: true,
	    				cwd: "prod",
	    				src: "**"
	    			}, {
	    				expand: true,
	    				src: "archives/**"
	    			}
	    		]
	    	}
	    },

	    // Контроль изменений
	    watch: {
	    	// Перегенерация спрайта при добавлении картинок
	    	sprite: {
	    		options: {
	    			cwd: (settings.paths.dev.images + "/sprites")
	    		},
	    		files: "*.png",
	    		tasks: ["sprite:all"]
	    	},
	    	// Отслеживание изменения стилей
	    	styles: {
	      		options: {
	      			cwd: settings.paths.dev.css
	      		},
	      		files: [
	      			"*.styl",
	      			"**/*.styl"
	      		],
	        	tasks: ["newer:stylus:main"]
	      	},
	      	// Стилевые картинки
	    	images: {
	      		options: {
	      			cwd: settings.paths.dev.images
	      		},
	      		files: [
	      			"*.png",
	      			"**/*.png",
	      			"*.jpg",
	      			"**/*.jpg",
	      			"*.gif",
	      			"**/*.gif"
	      		],
	        	tasks: ["sync:images"]
	      	},
	      	// SVG иконки
	    	svg: {
	      		options: {
	      			cwd: settings.paths.dev.svg
	      		},
	      		files: [
	      			"*.svg",
	      			"**/*.svg",
	      			"*.svg",
	      			"**/*.svg"
	      		],
	        	tasks: ["sync:svg"]
	      	},
	    	// Отслеживание изменения шрифтов
	    	fonts: {
	      		options: {
	      			cwd: settings.paths.dev.fonts
	      		},
	      		files: [
	      			"*.*",
	      		],
	        	tasks: ["sync:fonts"]
	      	},
	     	// Отслеживание JS файлов
	      	js: {
	      		options: {
	      			cwd: settings.paths.dev.js
	      		},
	      		files: [
	      			"*.js",
	      			"**/*.js"
	      		],
	      		tasks: ["sync:js"]
	      	},
	      	// Синхронизация презентационной графики
	      	dummy: {
	    		options: {
	    			cwd: settings.paths.dev.dummy
	    		},
	      		files: [
	      			"*.jpg",
	      			"*.png",
	      			"**/*.jpg",
	      			"**/*.png"
	      		],
	      		tasks: ["sync:dummy"]
	      	},
	      	// Макеты (страницы). Обновлется только измененная страница
	      	views: {
	      		options: {
	      			cwd: settings.paths.dev.views
	      		},
	      		files: [
	      			"*.jade"
	      		],
	        	tasks: ["newer:jade:views"]
	      	},
	      	// Базовые шаблоны. Обновляются все страницы
	      	template: {
	      		options: {
	      			cwd: settings.paths.dev.templates
	      		},
	      		files: [
	      			"*.jade"
	      		],
	      		tasks: ["jade:views"]
	      	},
	      	// Список страниц на верстку
	      	frontpage: {
	      		files: [
	      			"settings.json",
	      			"./dev/index.jade"
	      		],
	      		tasks: ["jade:front"]
	      	}
	    },

	    // Синхронизация
	    sync: {
	    	svg: {
	    		files: [
	    			{
	    				cwd: settings.paths.dev.svg,
	    				src: [
	    					"**",
	    					"*"
	    				],
	    				dest: settings.paths.prod.svg
	    			}
	    		],
	    		pretent: true,
	    		updateAndDelete: true
	    	},
	    	// Стилевые картинки
	    	images: {
	    		files: [
	    			{
	    				cwd: settings.paths.dev.images,
	    				src: [
	    					"**",
	    					"*",
	    					"!sprites",
	    					"!sprites/*"
	    				],
	    				dest: settings.paths.prod.images
	    			}
	    		],
	    		pretent: true,
	    		updateAndDelete: true
	    	},
	    	// Скрипты
	    	js: {
	    		files: [
	    			{
	    				cwd: settings.paths.dev.js,
	    				src: [
	    					"**",
	    					"*.js"
	    				],
	    				dest: settings.paths.prod.js
	    			}
	    		],
	    		pretent: true,
	    		updateAndDelete: true
	    	},
	    	// Шрифты
	    	fonts: {
	    		files: [
	    			{
	    				cwd: settings.paths.dev.fonts,
	    				src: "*",
	    				dest: settings.paths.prod.fonts
	    			}
	    		],
	    		pretent: true,
	    		updateAndDelete: true
	    	},
	    	// Презентационная графика
	    	dummy: {
	    		files: [
	    			{
	    				cwd: settings.paths.dev.dummy,
	    				src: [
	    					"**",
	    					"*"
	    				],
	    				dest: settings.paths.prod.dummy
	    			}
	    		],
	    		verbose: true,
	    		pretent: true,
	    		updateAndDelete: true
	    	},
	    	// Дополнительные файлы
	    	service: {
	    		files: [
	    			{
	    				cwd: settings.paths.dev.root,
	    				src: ["robots.txt", ".htaccess", "favicon.png"],
	    				dest: settings.paths.prod.root
	    			}
	    		],
	    		pretent: true,
	    		updateAndDelete: true,
	    		ignoreInDest: ["**/i/", "**/i/*", "**/css/", "**/css/*", "**/dummy/", "**/dummy/*", "**/dummy/**/*", "**/js/", "**/js/*", "**/fonts/", "**/fonts/*", "**/index.html", "**/pages/", "**/pages/*", "**/svg/", "**/svg/*"]
	    	},
	    },

	    browserSync: {
	    	bsFiles: {
	    		src: "./prod/css/stub.css"
	    	},
	    	options: {
	    		watchTask: true,
	    		server: {
	    			baseDir: "./prod/"
	    		}
	    	}
	    }

	});
	// Jade шаблонизатор
	grunt.loadNpmTasks("grunt-contrib-jade");
	// Генератор спрайтов
	grunt.loadNpmTasks("grunt-spritesmith");
	// Стилевые файлы
	grunt.loadNpmTasks("grunt-contrib-stylus");
	// Синхронизация файлов
	grunt.loadNpmTasks('grunt-sync');
	// Контроль изменения файлов
	grunt.loadNpmTasks("grunt-contrib-watch");
	grunt.loadNpmTasks("grunt-newer");
	// Создание архива проекта
	grunt.loadNpmTasks("grunt-contrib-compress");
	// FTP
	grunt.loadNpmTasks("grunt-ftp-push");
	// Imagemin
	grunt.loadNpmTasks("grunt-contrib-imagemin");
	// Синхронизация с браузером
	grunt.loadNpmTasks("grunt-browser-sync");

	/*** СОЗДАНИЕ КАРКАСА ПРОЕКТА ***/
	// Пример вызова: grunt start:<name — название проекта на Русском языке>:<code — кодовое имя проекта на латинице>:<year — год разработки проекта>
	grunt.registerTask("start", "Создание каркаса проекта", function(name, code, year) {
		// Проверка наличия необходимых параметров
		if(!name || !code || !year) {
			grunt.log.error("Не заданы обязательные параметры");
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
		// Задание кодового имени проекта и ссылки на демонстрационном сервере
		if(code) {
			settings.info.code = code;
			settings.info.productionUrl = "http://wemakesites.ru/" + code + "/";
		}
		// Задание года разработки
		if(year) {
			settings.info.year = year;
		}
		// Запись значений в файл settings.json
		grunt.file.write("settings.json", JSON.stringify(settings, null, "	"));
		// Шаблоны имен css и js файлов
		var cssFileName = settings.paths.dev.css + "/" + settings.info.code + ".styl",
			jsFileName = settings.paths.dev.js + "/" + settings.info.code + ".js";
		// Создание структуры каталогов проекта
		// CSS
		if(!grunt.file.exists(cssFileName)) {
			grunt.file.mkdir(settings.paths.dev.css);
			grunt.file.write(cssFileName);
		}
		// JS
		if(!grunt.file.exists(jsFileName)) {
			grunt.file.mkdir(settings.paths.dev.js);
			grunt.file.write(jsFileName);
		}
		// Стилевые картинки
		grunt.file.mkdir(settings.paths.dev.images);
		// Шрифты
		grunt.file.mkdir(settings.paths.dev.fonts);
		// Презентационная графика
		grunt.file.mkdir(settings.paths.dev.dummy);
		// Удаление файла .gitignore из директории для разработки
		grunt.file.delete(settings.paths.dev.root + "/.gitignore");
		grunt.log.ok("Проект успешно создан");
	});

	/*** ДОБАВЛЕНИЕ ИЛИ ОБНОВЛЕНИЕ СТРАНИЦЫ ***/
	// Пример вызова: grunt page:<name — название страницы>:<code — кодовое имя страницы>:<progress — текущий прогресс>:<template — название шаблона>
	grunt.registerTask("page", "Добавление или обновление страницы", function(name, code, progress, template) {
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
			// Обновление названия
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
		grunt.file.write("settings.json", JSON.stringify(settings, null, "	"));
		// Запускаем задание на обновление главной страницы
		grunt.task.run("jade:front");
	});

	/*** ГЕНЕРАЦИЯ ВСЕХ НЕОБХОДИМЫХ ШАБЛОНОВ И МАКЕТОВ ***/
	// Пример вызова: grunt generate
	grunt.registerTask("generate", "Генерирование шаблонов", function() {
		for(var pageCode in settings.pages) {
			var page = settings.pages[pageCode],
				curFile = settings.paths.dev.views + "/" + pageCode + ".jade",
				tmplPath = settings.paths.dev.templates + "/" + page.template + ".jade";
			// Проверка макета на существование
			if(grunt.file.isFile(curFile)) {
				grunt.log.write(curFile + " уже существует");
				continue;
			}
			// Создание шаблона
			if(page.template) {
				if(!grunt.file.isFile(tmplPath)) {
					grunt.file.write(tmplPath);
					grunt.log.ok("Шаблон " + page.template + " был создан");
				} else {
					grunt.log.error("Шаблон " + page.template + " уже существует");
				}
			}
			// Добавление указания шаблона к файлу макета
			var tmplStr = '';
			if(page.template) {
				tmplStr = "extends ../templates/" + page.template
			}
			// Создание файла макета
			grunt.file.write(curFile, tmplStr);
			grunt.log.ok(curFile + " успешно создан");
		}
	});

	/*** СОЗДАНИЕ ВЕРСИИ ДЛЯ ДЕМОНСТРАЦИИ ***/
	grunt.registerTask("production", ["sync", "jade:views", "jade:front", "stylus:main"]);

	/*** ВЫКЛАДКА НА ДЕМОНСТРАЦИОННЫЙ СЕРВЕР ***/
	grunt.registerTask("deploy", ["ftp_push:deploy"]);

	grunt.registerTask("see", ["browserSync", "watch"]);

	/*** Создание архива верстки ***/
	grunt.registerTask("archive", ["compress:production", "jade:front"]);
};
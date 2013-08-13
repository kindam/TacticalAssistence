(function() {

if ( typeof TWA !== 'undefined' ) {
	return TWA;
}

// adiciona o botão para mostrar/ocutar o menu.
var menuButton = jQuery( '<td class="icon-box"><div id="twa-menuOpen">twa</div></td>' ).appendTo( '#menu_row2' ),
// elemento do tempo atual do jogo
$serverTime = jQuery( '#serverTime' ),
// elemento da data atual do jogo
$serverDate = jQuery( '#serverDate' ),
// conteudo da página atual do jogo
$contentValue = jQuery( '#content_value' ),
// pega o "modo" que esta na página de visualização de aldeias
overview = ( document.getElementById( 'overview' ) || { value: 'production' }).value,
// elemento do tooltip usado no script
$tooltip = jQuery( '<div id="twa-tooltip"/>' ).appendTo( 'body' ),
// tabela com as funções utilizadas na visualização de aldeias
$overviewTools;

TWA = { version: '1.6.2' };

// LOAD METHODS HERE

// remove um item de um array
Array.prototype.remove = function( from, to ) {
	var rest = this.slice( ( to || from ) + 1 || this.length );
	this.length = from < 0 ? this.length + from : from;
	return this.push.apply( this, rest );
};

// furmata um numero de milesimos para hh:mm:ss
Number.prototype.format = function() {
	var hours = Math.floor( this / 36E5 ),
		min = Math.floor( this / 6E4 ) % 60,
		sec = ( this / 1000 ) % 60,
		str = hours + ':';
	
	if ( min < 10 ) {
		str += '0';
	}
	
	str += min + ':';
	
	if ( sec < 10 ) {
		str += '0';
	}
	
	return str += sec;
};

// substitue partes do string pelos argumentos passados
String.prototype.springf = function() {
	var args = arguments;
	
	return this.replace(/{(\d+)}/g, function( match, number ) {
		return typeof args[ number ] != 'undefined' ? args[ number ] : match;
	});
};

String.prototype.lang = function( name ) {
	var args = arguments;
	
	return String( this ).replace(/\{([^}]+)\}/g, function( _, prop ) {
		if ( !lang[ name ] ) {
			return lang.lang;
		} else if ( !lang[ name ][ prop ] ) {
			for ( var i = 2; i < args.length; i++ ) {
				if ( lang[ args[ i ] ][ prop ] ) {
					return lang[ args[ i ] ][ prop ];
				}
			}
			
			return 'LangError';
		}
		
		return lang[ name ][ prop ];
	});
};

// permite apenas numeros, barras, espaços
jQuery.fn.onlyNumbers = function( type ) {
	return this.keydown(function( e ) {
		var key = e.charCode || e.keyCode || 0;
		
		if ( e.ctrlKey ) {
			return true;
		}
		
		return ( key == 8 || key == 9 || key == 46 || key == 32 || ( type === 'coords' && e.shiftKey && key == 226 ) || ( key >= 37 && key <= 40 ) || ( key >= 48 && key <= 57 ) || ( key >= 96 && key <= 105 ) );
	});
};

// adiciona um tooltip a um elemento que tem o atributo "tooltip"
jQuery.fn.tooltip = jQuery.tooltip = function( elems ) {
	( this.jquery ? this : jQuery( elems ) ).hover(function( e ) {
		$tooltip.html( this.getAttribute( 'tooltip' ) );
		$tooltip.css({ top: e.pageY + 25, left: e.pageX + 15 }).show();
	}, function() {
		$tooltip.hide();
	}).mousemove(function( e ) {
		$tooltip.css({
			top: event.pageY + 25,
			left: event.pageX + 15
		});
	});
};

// jQuery( checkbox ).checkStyle()
// adiciona estilos nos checkbox.
jQuery.fn.checkStyle = function( events, handlers ) {
	return this.hide().each(function() {
		var self = this,
			checked,
			input = jQuery( this ),
			elem = jQuery( '<a class="checkStyle"></a>' ).click(function() {
				elem = jQuery( this );
				var checked = elem.hasClass( 'checked' );
				elem[ elem.hasClass( 'checked' ) ? 'removeClass' : 'addClass' ]( 'checked' );
				input.attr( 'checked', !checked );
				
				return false;
			}).bind( events, handlers ).addClass( this.className ).insertAfter( this );
		
		if ( input.is( ':checked' ) ) {
			elem.addClass( 'checked' );
		}
		
		if ( this.parentElement.nodeName.toLowerCase() === 'label' ) {
			jQuery( this ).click(function() {
				elem.trigger( 'click' );
			});
		}
	});
};

// adiciona .keydown aos elementos e permite apenas as keys selecionadas
jQuery.fn.acceptOnly = jQuery.acceptOnly = (function() {
	var codes = {
		num: function(e) { return e.keyCode > 47 && e.keyCode < 58; },
		space: function(e) { return e.keyCode === 32 },
		enter: function(e) { return e.keyCode === 13 },
		tab: function(e) { return e.keyCode === 9 },
		'|': function(e) { return e.keyCode === (jQuery.browser.mozilla ? 220 : 226) && e.shiftKey },
		':': function(e) { return e.keyCode === 191 && e.shiftKey },
		'/': function(e) { return ( e.keyCode === 193 || e.keyCode === 81 ) && e.altKey && !e.shiftKey }
	};
	
	function parse( props, event ) {
		var pass = false;
		props = props.split(' ');
		
		if ( event.keyCode == 40 || event.keyCode == 46 || event.keyCode == 8 || event.keyCode == 9 || event.keyCode == 27 || event.keyCode == 13 || (event.keyCode == 65 && event.ctrlKey === true) || (event.keyCode >= 35 && event.keyCode <= 39) || ((event.keyCode === 67 || event.keyCode === 86 || event.keyCode === 88) && event.ctrlKey)) {
			return true;
		}
		
		for ( var i = 0; i < props.length; i++ ) {
			if ( codes[ props[ i ] ]( event ) ) {
				return props[ i ];
			}
		}
		
		return false;
	}
	
	return function( elem, keys, handler ) {
		if ( this.jquery ) {
			handler = keys;
			keys = elem;
			elem = false;
		}
		
		var callback = function( event ) {
			var prop = parse( keys, event );
			
			if ( prop ) {
				return handler.call( this, event, prop );
			} else {
				return event.preventDefault();
			}
		};
		
		if ( elem ) {
			for ( var i = 0; i < elem.length; i++ ) {
				elem[ i ].keydown( callback );
			}
		} else {
			return this.keydown( callback );
		}
		
		return elem;
	};
})();

// facilita criar strings que vão arrays/objetos no meio
var createString = function( obj, callback, init, end ) {
	if ( typeof callback === 'string' ) {
		end = init;
		init = callback;
		callback = false;
	}
	
	init = init || '';
	
	if ( jQuery.isPlainObject(obj) ) {
		for ( var i in obj ) {
			init += callback ? callback.call( obj[ i ], i, obj[ i ] ) : obj[ i ];
		}
	} else {
		for ( var i = 0; i < obj.length; i++ ) {
			init += callback ? callback.call( obj[ i ], i, obj[ i ] ) : obj[ i ];
		}
	}
	
	return init + ( end || '' );
}

// pega os milesegundos de um tempo formatado
var formatToTime = function( _date, _time ) {
	var data, date;
	
	if ( _time ) {
		date = _date.split( '/' );
	} else {
		data = _date.split( ' ' );
		date = data[ 1 ].split( '/' );
	}
	
	return new Date( date[ 1 ] + '/' + date[ 0 ] + '/' + date[ 2 ] + ' ' + ( _time || data[ 0 ] ) ).getTime();
}

// formata o tempo (milisegundos)
var timeFormat = function( value ) {
	var date = new Date( value ),
	hour = date.getHours(),
	min = date.getMinutes(),
	sec = date.getSeconds(),
	day = date.getDate(),
	month = date.getMonth() + 1,
	year = date.getFullYear(),
	units = [];
	
	hour = hour < 10 ? '0' + hour : hour;
	min = min < 10 ? '0' + min : min;
	sec = sec < 10 ? '0' + sec : sec;
	day = day < 10 ? '0' + day : day;
	month = month < 10 ? '0' + month : month;
	
	return hour + ':' + min + ':' + sec + ' ' + day + '/' + month + '/' + year;
}

// verifica se um tempo é maior que o tempo atual do jogo
var validTime = function( dateTime ) {
	var valid = false;
	
	if ( /^\d+\:\d+\:\d+\s\d+\/\d+\/\d{4}$/.test( dateTime ) ) {
		var data = dateTime.split( ' ' ),
			inputDate = data[ 1 ].split( '/' ),
			currentDate = $serverDate.text().split( '/' );
		
		valid = ( new Date( inputDate[ 1 ] + '/' + inputDate[ 0 ] + '/' + inputDate[ 2 ] + ' ' + data[ 0 ] ) ) > ( new Date( currentDate[ 1 ] + '/' + currentDate[ 0 ] + '/' + currentDate[ 2 ] + ' ' + $serverTime.text() ) );
	}
	
	return valid;
}

// pega o url correto do jogo
var Url = function( screen, vid ) {
	return game_data.link_base_pure.replace( /village=\d+/, 'village=' + ( vid || game_data.village.id ) ) + screen;
}

// adiciona as caixas para selecionar as aldeias na vizualização
var addCheckbox = function() {
	var stop = [ 'trader', 'groups', 'commands', 'incomings' ],
		table, tr;
	
	if ( stop.indexOf( overview ) >= 0 ) {
		return;
	} else if ( overview == 'units' ) {
		table = document.getElementById( 'units_table' );
		
		var tbody = table.getElementsByTagName( 'tbody' ),
			th = table.getElementsByTagName( 'th' )[ 0 ],
			tbodyTr;
		
		th.innerHTML = '<input type="checkbox" style="margin:0px" id="twa-selectAll"/> ' + th.innerHTML;
		
		for ( var i = 0; i < tbody.length; i++ ) {
			tbodyTr = tbody[ i ].getElementsByTagName( 'tr' )[ 0 ];
			tbodyTr.getElementsByTagName( 'td' )[ 0 ].innerHTML = '<input type="checkbox" name="village_ids[]" class="addcheckbox" style="margin:0px" value="' + jQuery( 'a[href*="village="]:first', tbody[ i ] )[ 0 ].href.match( /village=(\d+)/ )[ 1 ] + '"/>' + tbodyTr.getElementsByTagName( 'td' )[ 0 ].innerHTML;
		}
	} else {
		tr = jQuery( '.overview_table' )[ 0 ].getElementsByTagName( 'tr' );
		
		for ( var i = 0; i < tr.length; i++ ) {
			tr[ i ].innerHTML = ( !i ? '<th><input type="checkbox" id="twa-selectAll"/></th>' : '<td><input type="checkbox" name="village_ids[]" class="addcheckbox" value="' + jQuery( 'a[href*="village="]:first', tr[ i ] )[ 0 ].href.match( /village=(\d+)/ )[ 1 ] + '"/></td>' ) + tr[ i ].innerHTML;
		}
	}
	
	jQuery( '#twa-selectAll' ).click(function() {
		jQuery( '.addcheckbox:visible' ).attr( 'checked', this.checked );
	});
}

// loop em todas aldeias do mapa.
var mapVillages = function( callback ) {
	var village;
	
	for ( var x = 0; x < TWMap.size[ 1 ]; x++ ) {
		for ( var y = 0; y < TWMap.size[ 0 ]; y++ ) {
			var coord = TWMap.map.coordByPixel( TWMap.map.pos[ 0 ] + ( TWMap.tileSize[ 0 ] * y ), TWMap.map.pos[ 1 ] + ( TWMap.tileSize[ 1 ] * x ) );
			
			if ( village = TWMap.villages[ coord.join( '' ) ] ) {
				village.player = TWMap.players[ village.owner ];
				
				if ( typeof village.points === 'string' ) {
					village.points = Number( village.points.replace( '.', '' ) );
				}
				
				callback.call( village, coord );
			}
		}
	}
};

// manipulado de estilos css
var Style = (function() {
	var rspecial = /^-special-/,
		special = jQuery.browser.mozilla ? '-moz-' : jQuery.browser.webkit ? '-webkit-' : jQuery.browser.opera ? '-o-' : '';
	
	function Style() {
		this._styles = {};
		return this;
	}
	
	Style.prototype = {
		add: function( name, css ) {
			if ( this._styles[ name ] ) {
				this._styles[ name ].css = jQuery.extend( this._styles[ name ].css, this.compatibility( css ) );
				this._styles[ name ].elem.html( this.stringfy( this._styles[ name ].css ) );
				return this;
			} else {
				this._styles[ name ] = {};
				this._styles[ name ].css = this.compatibility( css );
				this._styles[ name ].elem = jQuery( '<style>' ).html( this.stringfy( this._styles[ name ].css ) ).appendTo( 'head' );
				return this;
			}
		},
		stringfy: function( css ) {
			var styles = [];
			
			for ( var selector in css ) {
				var props = [];
				
				for ( var prop in css[ selector ] ) {
					var val = css[ selector ][ prop ];
					if ( typeof val === 'number' ) { val += 'px'; }
					props.push( prop + ':' + val );
				}
				
				styles.push( selector + '{' + props.join( ';' ) + '}' );
			}
			
			return styles.join( '' );
		},
		compatibility: function( css ) {
			var out = {};
			
			for ( var selector in css ) {
				var props = {};
				
				for ( var prop in css[ selector ] ) {
					if ( rspecial.test( css[ selector ][ prop ] ) ) {
						css[ selector ][ prop ] = css[ selector ][ prop ].replace( '-special-', special );
					}
					
					props[ prop ] = css[ selector ][ prop ];
				}
				
				out[ selector ] = props;
			}
			
			return out;
		}
	};
	
	return new Style();
})();

// centraliza um elemento no centro da tela
var center = function( elem ) {
	var $win = jQuery( window );
	return elem.css( 'left', Math.max( 0, ( ( $win.width() - elem.outerWidth() ) / 2 ) + $win.scrollLeft() ) );
}

// menu com ferramentas/configurações
var Menu = (function() {
	var Menu = function( elemOpen, onclick ) {
		var self = this;
		this.opened = false;
		this._menus = {};
		this._active = 'config';
		this.menu = jQuery( '<div class="twa-menu"><div class="head"><ul></ul></div><div class="body"></div></div>' ).appendTo( 'body' );
		
		elemOpen.click(function() {
			if ( onclick && onclick.call( self ) === false ) {
				return false;
			}
			
			self[ self.menu.is( ':visible' ) ? 'hide' : 'show' ]();
		});
		
		return this;
	};
	
	Menu.prototype = {
		add: function( name, display, content, onload ) {
			var self = this;
			
			this._menus[ name ] = [jQuery( '<li/>' ).append(jQuery( '<a href="#" class="' + name + '">' + display + '</a>' ).click(function() {
				return self.select( name );
			})).appendTo( jQuery( '.head ul', this.menu ) ), jQuery( '<div style="display:none" class="' + name + '"/>' ).append( content ).appendTo( jQuery( '.body', this.menu ) ), onload];
			
			if ( this._active === name ) {
				this.select( name, true );
			}
			
			return this;
		},
		select: function( name, first ) {
			if ( first || this._active !== name ) {
				if ( this._active && this._menus[ this._active ] ) {
					this._menus[ this._active ][ 1 ].hide();
				}
				
				jQuery( '.head a', this.menu ).removeClass( 'active' );
				jQuery( '.head .' + name, this.menu ).addClass( 'active' );
				this._active = name;
				this._menus[ name ][ 1 ].show();
				
				if ( this._menus[ name ][ 2 ] ) {
					if ( this.opened ) {
						this._menus[ name ][ 2 ].call( this._menus[ name ][ 1 ] );
						this._menus[ name ][ 2 ] = false;
					} else {
						this.open = function() {
							this._menus[ name ][ 2 ].call( this._menus[ name ][ 1 ] );
							this._menus[ name ][ 2 ] = false;
						};
					}
				}
			}
			
			return false;
		},
		show: function() {
			return this.menu.show( 300 );
		},
		hide: function() {
			return this.menu.hide( 300 );
		}
	};
	
	return Menu;
})();

Menu = new Menu(menuButton, function() {
	if ( !this.opened ) {
		this.opened = true;
		this.open && this.open();
		this.menu = center( this.menu );
	}
	return true;
});

var Delay = (function() {
	function Delay() {
		Delay.sets = Delay.sets || {};
		Delay.add.apply( this, arguments );
	};

	Delay.remove = function( name ) {
		clearTimeout( Delay.sets[ name ] );
		delete Delay.sets[ name ];
	};

	Delay.add = function( name, handler, time, self ) {
		var id = 0;
		
		if ( Delay.sets[ name ] ) {
			Delay.remove( name );
		}
		
		function set() {
			return setTimeout(function() {
				if ( handler.call( self, id++ ) === true ) {
					Delay.sets[ name ] = set();
				}
			}, time)
		}
		
		Delay.sets[ name ] = set();
	};
	
	return Delay;
})();

// estilos CSS gerais
Style.add('twa', {
	'#twa-menuOpen, #twa-commentsOpen': { margin: '0px 6px 0px 2px', 'border-radius': 4, padding: '0px 3px 2px 3px', 'font-family': 'courier new', border: '1px solid rgba(0,0,0,0.25)', background: '-special-linear-gradient(bottom, #e7e7e7 100%, #c5c5c5 0%)', cursor: 'pointer' },
	'#twa-tooltip': { position: 'absolute', display: 'none', 'z-index': '999999', background: 'rgba(0,0,0,.8)', width: 300, color: '#ccc', padding: 4, 'border-radius': 2, 'box-shadow': '1px 1px 3px #333' },
	'.twaInput': { background: '#F3F3F3', 'border-radius': 6, 'box-shadow': '0 1px 4px rgba(0,0,0,0.2) inset', 'font-family': 'courier new', border: '1px solid #bbb', color: '#555' },
	'.twaInput:disabled': { background: '#ddd', color: '#aaa' },
	'.twaButton': { 'border-radius': 3, margin: 10, padding: '7px 20px', background: '-special-linear-gradient(bottom, #CCC 0%, white 100%)', border: '1px solid #AAA', 'font-weight': 'bold' },
	'.checkStyle': { display: 'block', 'float': 'left', background: 'url(http://i.imgur.com/MhppaVe.png) top left no-repeat', 'background-position': '-4px -5px', width: 21, height: 20 },
	'.checkStyle.checked': { 'background-position': '-4px -65px' },
	'.checkStyle.center': { margin: '0 auto', 'float': 'none!important' },
	// table
	'.twa-table': { width: '100%' },
	'.twa-table th': { 'text-align': 'center', background: '-special-linear-gradient(bottom, #BBB 30%, #CCC 100%) !important', padding: '7px !important' },
	'.twa-table td': { 'text-align': 'center', padding: '7px 0' },
	// menu
	'.twa-menu': { display: 'none', 'z-index': '12000', position: 'absolute', top: 130, 'font-family': 'Helvetica', 'font-size': 12, width: 1020, background: '#eee', color: '#333', border: 'solid 1px rgba(0,0,0,0.2)', 'border-radius': 4, 'box-shadow': '3px 3px 5px rgba(0,0,0,0.2)', margin: '0 auto 30px' },
	'.twa-menu a': { 'font-weight': '700' },
	'.twa-menu .head': { 'text-align': 'center', height: 25, 'border-bottom': '1px solid #ddd' },
	'.twa-menu .head ul': { 'line-height': 15, padding: 0 },
	'.twa-menu .head li': { 'list-style': 'none', display: 'inline', 'border-right': '1px solid #bbb', padding: '0 13px' },
	'.twa-menu .head li:last-child': { border: 'none' },
	'.twa-menu .head li a': { color: '#666', 'text-decoration': 'none', padding: 8, 'font-size': 13, 'border-radius': 10 },
	'.twa-menu .head li a.active': { 'box-shadow': '0 0 5px #AAA inset' },
	'.twa-menu .body': { padding: 10 }
});

// nome do items salvos em localStorage
var memory = { settings: 'TWASettings' + game_data.player.id, data: 'TWAData' + game_data.player.id },
// servidor atual do jogo
market = game_data.market === 'br' ? 'pt' : game_data.market,
update = false;

// configurações e dados salvos
TWA.settings = localStorage[ memory.settings ] ? JSON.parse( localStorage[ memory.settings ] ) : false;
TWA.data = localStorage[ memory.data ] ? JSON.parse( localStorage[ memory.data ] ) : false;

// caso não esteja na versão atual do script ou o script
// não tenha sido executado nenhum vez ainda cria uma nova
// configuração padrão para o script
if((function() {
	// caso não exista as configurações ou os dados salvos
	// cria nova configuração
	if ( !TWA.settings || !TWA.data ) {
		return true;
	// caso a versão usada não seja a atual do script
	// cria novas configurações
	} else if ( TWA.data.version !== TWA.version ) {
		TWA.data.version = TWA.version;
		// salva as configurações e dados antigos para serem
		// repassados ao novo e não perdelas
		TWA.oldSettings = TWA.settings;
		TWA.oldData = TWA.data;
		
		Style.add('update', { '#newVersion span': { display: 'block', 'margin-bottom': 6, 'font-size': 11 } });
		UI.SuccessMessage( '<div id="newVersion"><b>Relaxeaza Tribal Wars Advanced - Version ' + TWA.version + '. </b><p>Alterações/Changes<br/> <span><b>Adicionado:</b> Sistema de comentários do facebook.</span><span><b>Reparado:</b> Alguns problemas do "Ultimas Conquistas" e "Planeador de Ataques".</span><span>Mais informações <a href="https://github.com/relaxeaza/twadvanced/wiki/Tribal-Wars-Advanced">aqui</a></span></p></div>', 60000 );
		
		return true;
	}
})()) {
	localStorage[ memory.settings ] = JSON.stringify(TWA.settings = jQuery.extend({
		mapcoords: true,
		profilecoords: true,
		_profilecoordsmin: 0,
		_profilecoordsmax: 12500,
		_mapplayers: true,
		_mapplayersmin: 0,
		_mapplayersmax: 1000,
		_mapabandoneds: true,
		_mapabandonedsmin: 0,
		_mapabandonedsmax: 12500,
		mapidentify: true,
		mapmanual: true,
		lastattack: true,
		rankinggraphic: true,
		allygraphic: true,
		profilestats: true,
		reportfilter: true,
		villagefilter: true,
		reportrename: true,
		commandrename: true,
		troopcounter: true,
		mapgenerator: true,
		reportcalc: true,
		_reportcalc: { actives: [ 'knight', 'light', 'marcher', 'spear' ], spy: 5, ram: 5, currentVillage: false },
		assistentfarm: true,
		autofarm: true,
		_autofarm: { protect: true, index: 0, units: {}, coords: [], random: true },
		building: true,
		_buildingbuild: { main: 20, barracks: 25, stable: 20, garage: 10, snob: 1, smith: 20, place: 1, statue: 1, market: 10, wood: 30, stone: 30, iron: 30, farm: 30, storage: 30, hide: 0, wall: 20 },
		_buildingdestroy: { main: 20, barracks: 25, stable: 20, garage: 10, snob: 1, smith: 20, place: 1, statue: 1, market: 10, wood: 30, stone: 30, iron: 30, farm: 30, storage: 30, hide: 0, wall: 20 },
		_buildingmaxorders: 5,
		research: true,
		changegroups: true,
		attackplanner: true,
		selectvillages: true,
		overview: true,
		_overviewmode: 'production',
		renamevillages: true,
		lang: market
	}, TWA.oldSettings || {}));
	
	localStorage[memory.data] = JSON.stringify(TWA.data = jQuery.extend({
		version: TWA.version,
		attackplanner: {
			commands: [],
			lastTime: $serverTime.text() + ' ' + $serverDate.text()
		}
	}, TWA.oldData || {}));
}

var languages = {};

// LOAD LANGS HERE

var lang = !languages[ TWA.settings.lang ] ? languages.pt : languages[ TWA.settings.lang ];

TWA.ready(function() {
	switch( game_data.screen ) {
		case 'map':
			( TWA.settings._mapplayers || TWA.settings._mapabandoneds ) && TWA.mapCoords.init();
			TWA.settings.mapmanual && TWA.mapManual();
			TWA.settings.lastattack && game_data.player.premium && TWA.lastAttack();
		break;
		case 'info_player':
			TWA.settings.profilecoords && TWA.profileCoords();
			TWA.settings.profilestats && TWA.profileGraphic();
		break;
		case 'info_ally':
			TWA.settings.profilestats && TWA.profileGraphic();
		break;
		case 'info_member':
			TWA.settings.allygraphic && game_data.screen === 'info_member' && TWA.tooltipGraphic();
		break;
		case 'ranking':
			TWA.settings.mapgenerator && game_data.mode !== 'awards' && game_data.mode !== 'wars' && game_data.mode !== 'secrets' && TWA.mapGenerator();
			TWA.settings.rankinggraphic && TWA.tooltipGraphic();
		break;
		case 'overview_villages':
			$overviewTools = jQuery( '<table class="vis" id="twa-overviewtools" style="display:none" width="100%"><tr><th>Tribal Wars Advanced</th></tr></table>' ).insertBefore( '.overview_table' );
			
			addCheckbox();
			TWA.settings.overview && !game_data.player.premium && TWA.overview.init();
			TWA.settings.renamevillages && TWA.renamevillages.init();
			TWA.settings.commandrename && overview === 'commands' && TWA.rename.commands();
			TWA.settings.villagefilter && overview !== 'trader' && TWA.villageFilter();
			TWA.settings.troopcounter && overview === 'units' && TWA.troopCounter();
			TWA.settings.changegroups && game_data.player.premium && overview !== 'groups' && overview !== 'trader' && TWA.changegroups.init();
			TWA.settings.building && overview === 'buildings' && TWA.building.init();
			TWA.settings.research && overview === 'tech' && TWA.research.init();
			TWA.settings.selectvillages && game_data.player.premium && TWA.selectVillages.init();
		break;
		case 'report':
			TWA.settings.reportcalc && /view\=\d+/.test( location.href ) && TWA.reportCalc();
			TWA.settings.reportfilter && TWA.reportFilter();
			TWA.settings.reportrename && game_data.player.premium && TWA.rename.reports();
		break;
		case 'am_farm':
			TWA.settings.assistentfarm && game_data.player.farm_manager && !document.getElementsByClassName( 'error' ).length && TWA.assistentfarm.init();
		break;
	}
	
	TWA.settings.attackplanner && TWA.attackplanner.init();
	TWA.settings.autofarm && TWA.autofarm.init();
	TWA.lastConquests.init();
	TWA.config();
});

})();
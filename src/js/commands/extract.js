"use strict"
/**
 * @class  elFinder command "extract"
 * Extract files from archive
 *
 * @author Dmitry (dio) Levashov
 **/
elFinder.prototype.commands.extract = function() {
	var self    = this,
		fm      = self.fm,
		mimes   = [],
		filter  = function(files) {
			return $.map(files, function(file) { 
				return file.read && $.inArray(file.mime, mimes) !== -1 ? file : null
				
			})
		};
	
	this.title = 'Extract files from archive';
	this.disableOnSearch = true;
	
	// Update mimes list on open/reload
	fm.bind('open reload', function() {
		mimes = fm.option('archivers')['extract'] || [];
		self.change();
	});
	
	this.getstate = function(sel) {
		var sel = this.files(sel),
			cnt = sel.length;
		
		return cnt && filter(sel).length == cnt ? 0 : -1;
	}
	
	this.exec = function(hashes) {
		var files    = this.files(hashes),
			dfrd     = $.Deferred(),
			errors   = fm.errors,
			cnt      = files.length, 
			complete = cnt, 
			i, file, error;
		
		if (!(cnt && mimes.length)) {
			return dfrd.reject();
		}
		
		for (i = 0; i < cnt; i++) {
			file = files[i];
			if (!(file.read && fm.file(file.phash).write)) {
				error = [errors.extract, file.name, errors.denied]
				fm.error(error);
				return dfrd.reject(error);
			}
			
			if ($.inArray(file.mime, mimes) === -1) {
				error = [errors.extract, file.name, errors.notarchive];
				fm.error(error);
				return dfrd.reject(error);
			}
			
			fm.ajax({
				data       : {cmd : 'extract', target : file.hash, current : file.phash},
				notify     : {type : 'extract', cnt : 1},
				syncOnFail : true
			})
			.fail(function(error) {
				fm.error(error);
				if (!dfrd.isRejected()) {
					dfrd.reject(error);
				}
			})
			.done(function() {
				complete--;
				if (complete == 0) {
					dfrd.resolve();
				}
			});
			
		}
		
		return dfrd;
	}

}
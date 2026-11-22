/* InviteHeaven invitation footer: one function that makes the footer markup.
   Used by the invitation page (envelope-engine.js) and by the dashboard preview, so both always look the same.
   IHFooter.html({ bride, groom, mode: 'couple' | 'family' | 'none', family, seats }) */
(function () {
	var esc = function (s) {
		return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
			return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
		});
	};
	var first = function (n) {
		return String(n || '').trim().split(/\s+/)[0] || '';
	};
	// a thin line, a small diamond and two dots, then a thin line (fades out at both ends)
	var divider = function (id) {
		return (
			'<svg class="ihf-div" viewBox="0 0 300 16" aria-hidden="true"><defs><linearGradient id="' + id + 'a" x1="0" x2="1"><stop offset="0" stop-color="#d9b676" stop-opacity="0"/><stop offset="1" stop-color="#d9b676"/></linearGradient>' +
			'<linearGradient id="' + id + 'b" x1="0" x2="1"><stop offset="0" stop-color="#d9b676"/><stop offset="1" stop-color="#d9b676" stop-opacity="0"/></linearGradient></defs>' +
			'<line x1="6" y1="8" x2="128" y2="8" stroke="url(#' + id + 'a)" stroke-width="1"/>' +
			'<line x1="172" y1="8" x2="294" y2="8" stroke="url(#' + id + 'b)" stroke-width="1"/>' +
			'<path d="M150 1.5 L156.5 8 L150 14.5 L143.5 8 Z" fill="none" stroke="#d9b676" stroke-width="1"/>' +
			'<path d="M150 4.6 L153.4 8 L150 11.4 L146.6 8 Z" fill="#d9b676"/>' +
			'<circle cx="135" cy="8" r="1.6" fill="#d9b676"/><circle cx="165" cy="8" r="1.6" fill="#d9b676"/></svg>'
		);
	};
	// the small ornament that sits on the top edge of the frame
	var crest =
		'<svg class="ihf-crest" viewBox="0 0 120 30" aria-hidden="true" fill="none" stroke="#d9b676" stroke-width="1.1" stroke-linecap="round">' +
		'<path d="M60 3 L66 15 L60 27 L54 15 Z" fill="#d9b676" fill-opacity=".9"/>' +
		'<path d="M52 15 C44 6 30 6 22 13 C30 11 40 13 46 17 C40 20 30 21 22 17 C30 24 44 24 52 15Z"/>' +
		'<path d="M68 15 C76 6 90 6 98 13 C90 11 80 13 74 17 C80 20 90 21 98 17 C90 24 76 24 68 15Z"/>' +
		'<circle cx="12" cy="15" r="1.8" fill="#d9b676" stroke="none"/><circle cx="108" cy="15" r="1.8" fill="#d9b676" stroke="none"/></svg>';
	window.IHFooter = {
		html: function (o) {
			o = o || {};
			var mode = o.mode === 'family' || o.mode === 'none' ? o.mode : 'couple';
			var names = first(o.bride) + (first(o.bride) && first(o.groom) ? ' & ' : '') + first(o.groom);
			if (mode === 'family') names = String(o.family || '').trim() || names;
			var seats = Math.floor(Number(o.seats)) || 0;
			var top;
			if (mode === 'none') {
				// no names: the greeting itself becomes the big script line
				top = '<h2 class="ihf-names ihf-big">With Love<span class="ihf-amp">&amp;</span>Warm Regards</h2>';
			} else {
				var len = names.length;
				top =
					'<p class="ihf-top"><i></i><span>With Love &amp; Warm Regards</span><i></i></p>' +
					'<h2 class="ihf-names' + (len > 22 ? ' ihf-xs' : len > 15 ? ' ihf-sm' : '') + '">' + esc(names) + '</h2>';
			}
			var id = 'ihd' + Math.floor(Math.random() * 1e6);
			return (
				'<div class="ihf"><div class="ihf-frame">' + crest +
				top + divider(id + 'x') +
				(seats ? '<p class="ihf-seats">' + seats + (seats === 1 ? ' Seat' : ' Seats') + ' Reserved</p><p class="ihf-honour">in your honour</p>' : '') +
				'<p class="ihf-msg">Your presence will make our celebration even more special!</p>' +
				divider(id + 'y') +
				'<a class="ihf-brand" href="/"><span class="ihf-by">Created by</span><span class="ihf-bn">Invite<b>Heaven</b></span></a>' +
				'</div></div>'
			);
		},
	};
})();

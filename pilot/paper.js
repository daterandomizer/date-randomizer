'use strict';

window.PilotPaper = (() => {
    const {element, button} = PilotGames;
    let game;
    let paper;
    let sheet;
    let transition;
    let trigger;
    let gameButton;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');

    function hasProgress() {
        return Boolean(game?.active?.());
    }

    function allowDiscard() {
        return !hasProgress() || window.confirm('Завершить игру? Текущий прогресс будет сброшен.');
    }

    function closeSheet(immediate = false) {
        if (!sheet?.open) return;
        transition?.cancel();
        const dialog = sheet;
        const visual = getComputedStyle(dialog);
        const close = () => {
            const body = dialog.querySelector('.pilot-sheet-body');
            body.querySelector('section:not([hidden])').dataset.scroll = body.scrollTop;
            dialog.close();
            document.documentElement.classList.remove('pilot-sheet-open');
            if (gameButton && game) {
                gameButton.textContent = game.active?.() ? 'Продолжить игру' : 'Открыть игру';
            }
            if (!immediate) trigger?.focus({preventScroll:true});
        };
        if (immediate || reduced.matches || !dialog.animate) return close();
        transition = dialog.animate([
            {transform:visual.transform, opacity:visual.opacity}, {transform:'translateY(20px)', opacity:0}
        ], {duration:170, easing:'ease-in', fill:'forwards'});
        transition.finished.then(close, () => {});
    }

    function showSheet(card, pane, source) {
        trigger = source;
        if (!sheet) {
            sheet = element('dialog', '', 'pilot-sheet');
            sheet.setAttribute('aria-labelledby', 'pilot-sheet-title');
            if (document.documentElement.classList.contains('winter-view')) sheet.classList.add('pilot-sheet-winter');
            const head = element('header', '', 'pilot-sheet-head');
            const back = button('К записке', () => closeSheet(), 'pilot-back');
            const title = element('h2', card.title);
            title.id = 'pilot-sheet-title';
            head.append(back, title);
            const body = element('div', '', 'pilot-sheet-body');
            body.tabIndex = 0;
            const plan = element('section', '', 'pilot-sheet-plan');
            const play = element('section', '', 'pilot-sheet-game');
            buildPlan(plan, card.details, card.facets);
            body.append(plan, play);
            sheet.append(head, body);
            sheet.addEventListener('cancel', event => {
                event.preventDefault();
                closeSheet();
            });
            document.body.append(sheet);
        }
        if (sheet.open) return;
        const body = sheet.querySelector('.pilot-sheet-body');
        const play = sheet.querySelector('.pilot-sheet-game');
        const plan = sheet.querySelector('.pilot-sheet-plan');
        if (pane === 'game' && !game) game = PilotGames.mount(play, card.details.mechanic);
        plan.hidden = pane !== 'plan';
        play.hidden = pane !== 'game';
        sheet.showModal();
        document.documentElement.classList.add('pilot-sheet-open');
        body.scrollTop = Number((pane === 'game' ? play : plan).dataset.scroll || 0);
        sheet.querySelector('.pilot-back').focus({preventScroll:true});
        if (!reduced.matches) {
            transition = sheet.animate([
                {transform:'translateY(28px)', opacity:.45}, {transform:'translateY(0)', opacity:1}
            ], {duration:280, easing:'cubic-bezier(.18,.72,.24,1)'});
        }
    }

    function buildPlan(parent, details, facets) {
        const plan = element('div', '', 'pilot-plan');
        if (details.materials?.length) {
            plan.append(element('h3', 'Что понадобится'), element('p', details.materials.join(', ')));
        }
        if (details.prepare) plan.append(element('h3', 'Подготовка'), element('p', details.prepare));
        if (details.steps?.length) {
            const steps = element('ol');
            for (const step of details.steps) steps.append(element('li', step));
            plan.append(element('h3', 'План'), steps);
        }
        const conditions = [facets.budget.condition, details.extra].filter(Boolean);
        if (conditions.length) {
            plan.append(element('h3', 'Кстати'));
            for (const condition of conditions) plan.append(element('p', condition));
        }
        parent.append(plan);
    }

    function clear() {
        closeSheet(true);
        game?.dispose?.();
        game = null;
        sheet?.remove();
        sheet = null;
        gameButton = null;
        trigger = null;
        document.getElementById('note-text').removeAttribute('tabindex');
        paper?.remove();
        paper = null;
        const note = document.getElementById('note');
        note.classList.remove('pilot-card');
        note.removeAttribute('aria-labelledby');
        note.removeAttribute('data-pilot-id');
        note.removeAttribute('data-format');
        document.getElementById('pilot-close').classList.add('hidden');
        document.getElementById('pilot-share').hidden = true;
        const url = document.getElementById('pilot-share-url');
        url.hidden = true;
        url.value = '';
    }

    function mount(card, preview) {
        const note = document.getElementById('note');
        note.classList.add('pilot-card');
        note.dataset.pilotId = card.pilotId;
        note.dataset.format = card.format;
        note.setAttribute('aria-labelledby', 'pilot-title');
        const title = element('h2', card.title, 'pilot-title');
        title.id = 'pilot-title';
        const summary = element('p', card.summary, 'pilot-summary');
        const hints = element('ul', '', 'pilot-hints');
        hints.setAttribute('aria-label', 'Условия свидания');
        for (const hint of card.hints) hints.append(element('li', hint));
        paper = element('div', '', 'pilot-paper');
        paper.append(title, summary, hints);
        const previous = document.getElementById('note-text');
        const text = previous.cloneNode(false);
        text.append(paper);
        if (card.format !== 'simple') text.tabIndex = 0;
        previous.replaceWith(text);

        if (card.details && card.format !== 'simple') {
            const actions = element('div', '', 'pilot-entry-actions');
            const planButton = button(card.format === 'guided' ? 'Как устроить' : 'Сценарий и правила',
                () => showSheet(card, 'plan', planButton));
            planButton.setAttribute('aria-haspopup', 'dialog');
            actions.append(planButton);
            if (card.details.mechanic && card.format === 'interactive') {
                gameButton = button('Начать игру', () => showSheet(card, 'game', gameButton), 'pilot-button pilot-entry-primary');
                gameButton.setAttribute('aria-haspopup', 'dialog');
                actions.append(gameButton);
            }
            paper.append(actions);
        }
        document.getElementById('pilot-close').classList.remove('hidden');
        if (preview) note.scrollTop = 0;
    }

    return {clear, mount, allowDiscard, hasProgress};
})();

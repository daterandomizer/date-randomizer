'use strict';

window.PilotPaper = (() => {
    const {element, button} = PilotGames;
    let game;
    let paper;
    let sheet;
    let layer;
    let background;
    let pendingCheck;
    let trigger;
    let gameButton;

    function hasProgress() {
        return Boolean(game?.active?.());
    }

    function allowDiscard() {
        return !hasProgress() || window.confirm('Завершить игру? Текущий прогресс будет сброшен.');
    }

    function closeSheet(immediate = false) {
        const wasOpen = layer && !layer.hidden;
        if (wasOpen) {
            const body = sheet.querySelector('.pilot-sheet-body');
            const visible = body.querySelector('section:not([hidden])');
            if (visible) visible.dataset.scroll = body.scrollTop;
        }
        if (layer) layer.hidden = true;
        sheet?.removeAttribute('open');
        clearTimeout(pendingCheck);
        document.documentElement.classList.remove('pilot-sheet-open');
        if (background) background.inert = false;
        background = null;
        if (!wasOpen) return;
        if (gameButton && game) gameButton.textContent = hasProgress() ? 'Продолжить игру' : 'Открыть игру';
        if (!immediate && trigger?.isConnected) trigger.focus({preventScroll:true});
    }

    function recover(error) {
        closeSheet(true);
        if (!game) sheet?.querySelector('.pilot-sheet-game')?.replaceChildren();
        showOperationStatus('Панель не открылась. Попробуйте ещё раз.');
        console.warn('Date Randomizer: panel recovered', error);
    }

    function checkPanel() {
        if (!layer || layer.hidden || document.hidden) return;
        const back = sheet.querySelector('.pilot-back');
        const box = back.getBoundingClientRect();
        const vv = window.visualViewport;
        const top = vv?.offsetTop || 0;
        const bottom = top + (vv?.height || window.innerHeight);
        const style = getComputedStyle(back);
        const bodyHeight = sheet.querySelector('.pilot-sheet-body').clientHeight;
        if (!sheet.hasAttribute('open') || !box.width || !box.height || bodyHeight < 44 || box.top < top - 1 ||
            box.bottom > bottom + 1 || style.visibility === 'hidden' ||
            getComputedStyle(sheet).opacity === '0') recover('Back control outside visible viewport');
    }

    function handleKeys(event) {
        if (!layer || layer.hidden) return;
        if (event.key === 'Escape') {
            event.preventDefault();
            closeSheet();
        }
        if (event.key !== 'Tab') return;
        const items = [...sheet.querySelectorAll('button:not(:disabled), input:not(:disabled), [tabindex="0"]')]
            .filter(el => el.getClientRects().length && !el.closest('[hidden]'));
        const edge = event.shiftKey ? items[0] : items.at(-1);
        if (items.length && (document.activeElement === edge || !items.includes(document.activeElement))) {
            event.preventDefault();
            (event.shiftKey ? items.at(-1) : items[0]).focus();
        }
    }

    function showSheet(card, pane, source, keyboard) {
        if (layer && !layer.hidden || document.getElementById('note').hasAttribute('data-flight')) return;
        trigger = source;
        try {
            if (!sheet) {
                const panel = element('section', '', 'pilot-sheet');
                panel.setAttribute('role','dialog');
                panel.setAttribute('aria-modal','true');
                panel.setAttribute('aria-labelledby', 'pilot-sheet-title');
                const head = element('header', '', 'pilot-sheet-head');
                const back = button('К записке', () => closeSheet(), 'pilot-back');
                const title = element('h2', card.title);
                title.id = 'pilot-sheet-title';
                title.tabIndex = -1;
                head.append(back, title);
                const body = element('div', '', 'pilot-sheet-body');
                body.tabIndex = 0;
                const plan = element('section', '', 'pilot-sheet-plan');
                const play = element('section', '', 'pilot-sheet-game');
                buildPlan(plan, card.details, card.facets);
                body.append(plan, play);
                panel.append(head, body);
                const overlay = element('div', '', 'pilot-layer');
                overlay.hidden = true;
                if (document.documentElement.classList.contains('winter-view')) {
                    panel.classList.add('pilot-sheet-winter');
                    overlay.classList.add('pilot-layer-winter');
                }
                overlay.append(panel);
                document.body.append(overlay);
                layer = overlay;
                sheet = panel;
            }
            const body = sheet.querySelector('.pilot-sheet-body');
            const play = sheet.querySelector('.pilot-sheet-game');
            const plan = sheet.querySelector('.pilot-sheet-plan');
            if (pane === 'game' && !game) game = PilotGames.mount(play, card.details.mechanic);
            plan.hidden = pane !== 'plan';
            play.hidden = pane !== 'game';
            sheet.classList.toggle('pilot-touch-open', !keyboard);
            sheet.setAttribute('open', '');
            layer.hidden = false;
            background = document.querySelector('.container');
            if (background) background.inert = true;
            document.documentElement.classList.add('pilot-sheet-open');
            (keyboard ? sheet.querySelector('.pilot-back') : sheet.querySelector('h2')).focus({preventScroll:true});
            body.scrollTop = Number((pane === 'game' ? play : plan).dataset.scroll || 0);
            showOperationStatus('');
            pendingCheck = setTimeout(checkPanel, 360);
        } catch (error) {
            recover(error);
        }
    }

    document.addEventListener('keydown', event => {
        if (event.key === 'Tab') sheet?.classList.remove('pilot-touch-open');
        handleKeys(event);
    });
    document.addEventListener('visibilitychange', checkPanel);
    window.addEventListener('pageshow', checkPanel);
    const afterResize = () => requestAnimationFrame(checkPanel);
    window.addEventListener('resize', afterResize);
    window.visualViewport?.addEventListener('resize', afterResize);
    window.visualViewport?.addEventListener('scroll', afterResize);

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
        layer?.remove();
        layer = null;
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
                event => showSheet(card, 'plan', planButton, event.detail === 0));
            planButton.setAttribute('aria-haspopup', 'dialog');
            actions.append(planButton);
            if (card.details.mechanic && card.format === 'interactive') {
                gameButton = button('Начать игру', event => showSheet(card, 'game', gameButton, event.detail === 0), 'pilot-button pilot-entry-primary');
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

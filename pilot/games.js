'use strict';

window.PilotGames = (() => {
    function element(tag, text, className) {
        const node = document.createElement(tag);
        if (text) node.textContent = text;
        if (className) node.className = className;
        return node;
    }

    function button(label, action, className = 'pilot-button') {
        const node = element('button', label, className);
        node.type = 'button';
        node.addEventListener('click', action);
        return node;
    }

    function options(parent, items, onSelect) {
        const list = element('div', '', 'pilot-options');
        const buttons = items.map((item, index) => {
            const key = button(item.label, () => onSelect(index), 'pilot-option');
            key.setAttribute('aria-pressed', 'false');
            key.append(element('span', item.text));
            list.append(key);
            return key;
        });
        parent.append(list);
        return index => buttons.forEach((key, i) => key.setAttribute('aria-pressed', String(i === index)));
    }

    function modes(parent, items, onSelect) {
        const group = element('div', '', 'pilot-mode-options');
        const toggle = button('Сменить режим', () => {
            group.hidden = !group.hidden;
            toggle.setAttribute('aria-expanded', String(!group.hidden));
            if (!group.hidden) group.querySelector('[aria-pressed=true]')?.focus({preventScroll:true});
        }, 'pilot-mode-toggle');
        toggle.hidden = true;
        group.id = 'pilot-mode-options';
        toggle.setAttribute('aria-controls', group.id);
        const mark = options(group, items, onSelect);
        parent.append(toggle, group);
        return index => {
            mark(index);
            group.hidden = true;
            toggle.hidden = false;
            toggle.textContent = items[index].label + ' · Сменить режим';
            toggle.setAttribute('aria-expanded', 'false');
            toggle.focus({preventScroll:true});
        };
    }

    function actions(primary, ...secondary) {
        primary.classList.add('pilot-primary');
        const row = element('div', '', 'pilot-game-actions');
        const links = element('div', '', 'pilot-secondary');
        links.append(...secondary);
        row.append(primary, links);
        return row;
    }

    function animate(node, frames, duration = 240) {
        if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
            node.animate(frames, {duration, easing:'cubic-bezier(.18,.72,.24,1)'});
        }
    }

    function choice(parent, config) {
        let selected = -1;
        const status = element('p', '', 'pilot-game-status');
        status.role = 'status';
        const select = index => {
            selected = selected === index ? -1 : index;
            mark(selected);
            clear.disabled = selected < 0;
            status.textContent = selected < 0 ? 'Выбор отменён.' : 'Выбрано: ' + config.options[selected].label;
        };
        const mark = options(parent, config.options, select);
        const clear = button('Отменить выбор', () => {
            select(selected);
            parent.querySelector('button').focus({preventScroll: true});
        });
        clear.disabled = true;
        clear.classList.add('pilot-link');
        parent.append(status, clear);
        return {active:() => selected >= 0};
    }

    function draw(parent, config) {
        const limit = config.draw.limit ?? config.options.length;
        let deck, used, active, current;
        const status = element('div', '', 'pilot-game-status');
        status.role = 'status';
        const slips = element('div', '', 'pilot-draw-slips');
        const progress = element('progress');
        progress.max = limit;
        progress.setAttribute('aria-label','Подсказки за раунд');
        function update(message) {
            status.textContent = message;
            progress.value = used;
            slips.replaceChildren();
            if (current) {
                const slip = element('article', '', 'pilot-slip');
                slip.append(element('h3', current.label), element('p', current.text));
                slips.append(slip);
                animate(slip, [{opacity:.4,transform:'translateY(7px)'},{opacity:1,transform:'none'}]);
            }
            next.hidden = !active;
            skip.hidden = !current;
            end.hidden = !active;
            restart.hidden = active;
        }
        function round() {
            deck = [...config.options];
            for (let i = deck.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [deck[i], deck[j]] = [deck[j], deck[i]];
            }
            used = 0;
            active = true;
            current = null;
            update('Подсказок в раунде: ' + limit);
        }
        function finish(keepCurrent = false) {
            active = false;
            if (!keepCurrent) current = null;
            update('Раунд завершён · ' + used + ' из ' + limit);
            restart.focus({preventScroll:true});
        }
        function advance() {
            current = deck.pop();
            used++;
            if (used === limit) finish(true);
            else update('Подсказка ' + used + ' из ' + limit);
        }
        const next = button(config.label, advance);
        const skip = button('Пропустить', () => active ? advance() : finish());
        const end = button('Закончить раунд', () => finish());
        const restart = button('Новый раунд', () => {
            round();
            next.focus({preventScroll:true});
        });
        restart.classList.add('pilot-primary');
        const controls = actions(next, skip, end);
        controls.insertBefore(restart, controls.lastChild);
        parent.append(status, progress, slips, controls);
        round();
        return {active:() => active && used > 0};
    }

    function timer(parent, config) {
        const total = config.timer.rounds;
        const duration = config.timer.secondsPerRound * 1000;
        let mode = -1;
        let round = 1;
        let deadline = null;
        let remaining = duration;
        let interval = null;
        let ended = false;
        const panel = element('div', '', 'pilot-game-panel');
        const status = element('p', '', 'pilot-game-status');
        status.role = 'status';
        const dial = element('div', '', 'pilot-dial');
        const clock = element('output', '', 'pilot-reading');
        dial.append(clock);
        clock.setAttribute('role', 'timer');
        clock.setAttribute('aria-label', 'Оставшееся время');
        const mark = modes(parent, config.options, index => {
            if (mode === index && !ended) return mark(mode);
            if (playing() && !window.confirm('Сменить режим? Текущий раунд будет сброшен.')) return;
            stop();
            mode = index;
            round = 1;
            remaining = duration;
            ended = false;
            mark(mode);
            render();
        });
        const timed = () => config.options[mode]?.mode !== 'untimed';
        const playing = () => mode >= 0 && !ended && (deadline !== null || remaining < duration || round > 1);
        function stop() {
            clearInterval(interval);
            interval = null;
            deadline = null;
        }
        function render() {
            panel.hidden = mode < 0;
            if (mode < 0) return;
            const minutes = Math.floor(Math.ceil(remaining / 1000) / 60);
            const seconds = Math.ceil(remaining / 1000) % 60;
            const text = ended ? 'Игра завершена' : 'Раунд ' + round + ' из ' + total + ' · Участник ' + (1 + (round - 1) % 2);
            const announcement = text + (!ended && timed() && !remaining ? ' · Время вышло' : '');
            if (status.textContent !== announcement) {
                status.textContent = announcement;
                animate(status, [{opacity:.5,transform:'translateY(3px)'},{opacity:1,transform:'none'}]);
            }
            const time = minutes + ':' + String(seconds).padStart(2, '0');
            if (clock.textContent !== time) clock.textContent = time;
            dial.style.setProperty('--pilot-time', remaining / duration * 100 + '%');
            dial.hidden = !timed() || ended;
            toggle.hidden = !timed() || ended || !remaining;
            toggle.textContent = deadline === null ? (remaining === duration ? 'Запустить' : 'Продолжить') : 'Пауза';
            next.hidden = ended;
            next.classList.toggle('pilot-primary', toggle.hidden);
            next.textContent = round < total ? 'Сменить роли' : 'Завершить последний раунд';
            finish.hidden = ended;
            restart.hidden = !ended;
        }
        function tick() {
            if (deadline === null) return;
            remaining = Math.max(0, deadline - Date.now());
            if (!remaining) stop();
            render();
        }
        const toggle = button('Запустить', () => {
            if (deadline !== null) {
                tick();
                stop();
            } else if (remaining > 0) {
                deadline = Date.now() + remaining;
                interval = setInterval(tick, 200);
            }
            render();
        });
        function end() {
            stop();
            ended = true;
            render();
            restart.focus({preventScroll:true});
        }
        const next = button('Сменить роли', () => {
            if (round >= total) return end();
            stop();
            round++;
            remaining = duration;
            render();
        });
        const finish = button('Закончить игру', end);
        const restart = button('Начать заново', () => {
            round = 1;
            remaining = duration;
            ended = false;
            render();
            (timed() ? toggle : next).focus({preventScroll:true});
        });
        restart.classList.add('pilot-primary');
        panel.append(status, dial, actions(toggle, next, finish), restart);
        parent.append(panel);
        render();
        document.addEventListener('visibilitychange', tick);
        return {
            active:playing,
            dispose() {
                stop();
                document.removeEventListener('visibilitychange', tick);
            }
        };
    }

    function score(parent, config) {
        let mode = -1;
        let round = 1;
        let player = 0;
        let scores = [0, 0];
        let previous = null;
        let best = 0;
        let actions = [];
        let done = false;
        const entry = config.score.entry;
        const panel = element('div', '', 'pilot-game-panel');
        const status = element('p', '', 'pilot-game-status pilot-sr');
        status.role = 'status';
        const board = element('div', '', 'pilot-scoreboard');
        board.setAttribute('aria-hidden','true');
        const metric = label => {
            const cell = element('div', '', 'pilot-metric');
            const value = element('strong');
            const caption = element('span', label);
            cell.append(value, caption);
            return {cell,value,caption};
        };
        const main = metric('Счёт');
        const record = metric('Лучший');
        const first = metric('Участник 1');
        const second = metric('Участник 2');
        const progress = element('p', '', 'pilot-score-progress');
        const prior = element('p', '', 'pilot-score-prior');
        board.append(progress, main.cell, record.cell, first.cell, second.cell, prior);
        const mark = modes(parent, config.options, index => {
            if (index === mode && !done) return mark(mode);
            if (playing()) {
                if (!window.confirm('Начать новую игру с другим счётом?')) return;
            }
            mode = index;
            mark(mode);
            reset();
        });
        const playerGroup = element('div', '', 'pilot-options pilot-players');
        const players = [0, 1].map(index => {
            const key = button('Участник ' + (index + 1), () => {
                player = index;
                render();
            });
            playerGroup.append(key);
            return key;
        });
        const form = element('form', '', 'pilot-score-entry');
        const label = element('label', entry?.label);
        const input = element('input');
        input.type = 'number';
        input.inputMode = 'numeric';
        input.enterKeyHint = 'done';
        input.min = entry?.min ?? 0;
        input.max = entry?.max ?? 1;
        input.step = '1';
        input.required = true;
        label.append(input);
        const add = element('button', entry?.submitLabel ?? '+1', 'pilot-button pilot-primary');
        if (!entry) add.setAttribute('aria-label', '+1 · ' + config.score.unit);
        add.type = 'submit';
        if (entry) form.append(label);
        form.append(add);
        form.addEventListener('submit', event => {
            event.preventDefault();
            if (done || !form.reportValidity()) return;
            const value = entry ? input.valueAsNumber : 1;
            if (!Number.isInteger(value)) return;
            scores[player] += value;
            actions.push({player, value});
            input.value = '';
            render();
        });
        const kind = () => config.options[mode]?.mode;
        const playing = () => mode >= 0 && !done && Boolean(actions.length || round > 1 || best > 0 || input.value);
        const total = () => scores[0] + scores[1];
        function reset() {
            round = 1;
            player = 0;
            scores = [0, 0];
            previous = null;
            best = 0;
            actions = [];
            done = false;
            input.value = '';
            render();
        }
        const undo = button('Отменить очки', () => {
            const last = actions.pop();
            if (last) scores[last.player] -= last.value;
            render();
        });
        const resetSeries = button('Прервать серию', () => {
            best = Math.max(best, total());
            scores = [0, 0];
            actions = [];
            render();
        });
        function end() {
            best = Math.max(best, total());
            done = true;
            render();
            restart.focus({preventScroll:true});
        }
        const next = button('Следующий раунд', () => {
            previous = [...scores];
            best = Math.max(best, total());
            round++;
            scores = [0, 0];
            actions = [];
            render();
        });
        const finish = button('Закончить игру', end);
        const restart = button('Новая игра', () => {
            reset();
            (entry ? input : add).focus({preventScroll:true});
        });
        function render() {
            panel.hidden = mode < 0;
            if (mode < 0) return;
            const personal = kind() === 'personal_progress';
            const series = kind() === 'shared_streak';
            const header = (done ? 'Игра завершена · ' : '') + (series ? 'Серия: ' : 'Раунд ' + round + ' из ' + config.score.rounds + ' · Счёт: ');
            let text = header + total() + ' · Лучший: ' + Math.max(best, total());
            if (personal) {
                text += '\nУчастник 1: ' + scores[0] + ' · Участник 2: ' + scores[1];
                if (previous) text += '\nПервый раунд: ' + previous[0] + ' / ' + previous[1];
            }
            if (series) text += '\nСерия продолжается, пока волан не упал.';
            status.textContent = text;
            progress.textContent = done ? 'Игра завершена' : series ? 'До первого падения волана' : 'Раунд ' + round + ' из ' + config.score.rounds;
            main.caption.textContent = series ? 'Серия' : 'Всего';
            function metricValue(metric, value) {
                if (metric.value.textContent === String(value)) return;
                metric.value.textContent = value;
                animate(metric.value,[{opacity:.55,transform:'translateY(3px)'},{opacity:1,transform:'none'}],175);
            }
            metricValue(main, total());
            metricValue(record, Math.max(best, total()));
            metricValue(first, scores[0]);
            metricValue(second, scores[1]);
            first.cell.hidden = second.cell.hidden = !personal;
            prior.hidden = !personal || !previous;
            prior.textContent = previous ? 'Первый раунд: ' + previous.join(' / ') : '';
            playerGroup.hidden = done || !personal;
            players.forEach((key, index) => key.setAttribute('aria-pressed', String(index === player)));
            form.hidden = done;
            undo.hidden = done;
            undo.disabled = !actions.length;
            resetSeries.hidden = done || !series;
            resetSeries.disabled = !actions.length;
            next.hidden = done || series || round >= config.score.rounds;
            finish.hidden = done;
            restart.hidden = !done;
        }
        const secondary = element('div', '', 'pilot-secondary');
        secondary.append(undo, resetSeries, next, finish);
        restart.classList.add('pilot-primary');
        panel.append(status, board, playerGroup, form, secondary, restart);
        parent.append(panel);
        render();
        return {active:playing};
    }

    const engines = {choice, draw, timer, score};
    function mount(parent, config) {
        parent.append(element('p', config.objective, 'pilot-objective'));
        parent.dataset.mechanic = config.type;
        return engines[config.type](parent, config);
    }

    return {mount, element, button};
})();

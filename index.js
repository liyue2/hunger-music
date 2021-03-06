const eventBus = {
    on: function (type, handler) {
        $(document).on(type, handler)
    },
    fire: function (type, data) {
        $(document).trigger(type, data)
    }
}

const Footer = {
    init: function () {
        this.$footer = $('footer')
        this.$rightBtn = $('.btn-right')
        this.$leftBtn = $('.btn-left')
        this.$box = $('.box')
        this.$ul = this.$footer.find('ul')
        this.$transitionEnd = true
        this.render()
        this.bind()
    },
    bind: function () {
        $(window).on('resize', () => {
            this.setStyle()
        })
        this.$rightBtn.on('click', () => {
            this.$li = this.$footer.find('li')
            this.$width = this.$li.outerWidth(true)
            this.$left = -parseInt(this.$ul.css('left'))
            if ((this.$ul.width() - this.$left) <= this.$box.width()) return
            if (!this.$transitionEnd) return
            this.$transitionEnd = false
            this.$ul.animate({
                left: '-=' + Math.floor(this.$box.width() / this.$width) * this.$width
            }, 400)
            window.setTimeout(() => {
                this.$transitionEnd = true
            }, 400)
        })
        this.$leftBtn.on('click', () => {
            this.$li = this.$footer.find('li')
            this.$width = this.$li.outerWidth(true)
            this.$left = parseInt(this.$ul.css('left'))
            if (this.$left >= 0) return
            if (!this.$transitionEnd) return
            this.$transitionEnd = false
            this.$ul.animate({
                left: '+=' + Math.floor(this.$box.width() / this.$width) * this.$width
            })
            window.setTimeout(() => {
                this.$transitionEnd = true
            }, 400)
        })
        this.$footer.on('click', 'li', function() {
            eventBus.fire('albumSelected', {
                data_channel_id: $(this).attr('data-channel-id'),
                name: $(this).find('.title').text()
            })
        })
    },
    render: function () {
        $.getJSON('https://jirenguapi.applinzi.com/fm/getChannels.php').done((response) => {
            this.$channels = response.channels
            this.renderFooter(response.channels)
        }).fail((error) => {
            console.log(error)
        })
    },
    renderFooter: function (channels) {
        let html = ''
        channels.forEach((item, index) => {
            html += '<li data-channel-id=' + item.channel_id + '>'
                + '<div class="cover" style="background-image:url(' + item.cover_small + ')"></div>'
                + '<h2 class="title">' + item.name + '</h2>'
        })
        this.$footer.find('.album-list').html(html)
        this.setStyle()
    },
    setStyle: function () {
        let count = this.$footer.find('li').length
        let width = this.$footer.find('li').outerWidth(true)
        this.$footer.find('ul').css({
            width: count * width + 'px'
        })
    }
}

const Fm = {
    init: function () {
        this.$container = $('#page-music')
        this.audio = new Audio()
        this.audio.autoplay = true
        this.defaultSong = {
            sid:255319,
            title:'瓦解',
            artist:'南拳妈妈',
            picture:"http://qukufile2.qianqian.com/data2/pic/bc10935c9d851cf03f6a17c8d92f6e23/73394/73394.jpg@s_1,w_300,h_300",
            url: 'http://zhangmenshiting.qianqian.com/data2/music/123081716/123081716.mp3?xcode=a40a63725b67d8854394f800f7f2550e',
        }
        this.bind()
        this.loadMusic()
    },
    bind: function () {
        const _this = this
        eventBus.on('albumSelected', (e, data) => {
            this.id = data.data_channel_id
            this.label = data.name
            this.loadMusic(this.id)
        })
        $('.icon-switch').on('click', function() {
            if ($(this).hasClass('icon-pause')) {
                $(this).removeClass('icon-pause').addClass('icon-play')
                _this.audio.pause()            
            } else if ($(this).hasClass('icon-play')) {
                $(this).removeClass('icon-play').addClass('icon-pause')
                _this.audio.play()            
            }             
        })
        $('.icon-next').on('click', () => {
            this.loadMusic(this.id)
        })
        this.audio.addEventListener('play', function() {
            window.clearInterval(this.statusClock)
            this.statusClock = window.setInterval(() => {
                this.updateTime()
            }, 1000)
        }.bind(this))
        this.audio.addEventListener('pause', function() {
            window.clearInterval(this.statusClock)
        }.bind(this))
        this.audio.addEventListener('timeupdate', function() {
            $('.progress').css({width: (this.audio.currentTime) /this.audio.duration*100 + '%'})
        }.bind(this))
        this.audio.addEventListener('ended', () => {
            $('.icon-switch').removeClass('icon-pause').addClass('icon-play')
        })
    },
    loadMusic: function(id) {
        $.getJSON('//jirenguapi.applinzi.com/fm/getSong.php', { channel: this.id }).done((response) => {
            this.song = response.song[0]
            this.setMusic()
            this.loadLyric(this.song.sid)
            $('.icon-switch').removeClass('icon-play').addClass('icon-pause')
        }).fail((error) => {
            console.log(error)
        })
    },
    setMusic: function() {
        this.song.url ? this.audio.src = this.song.url : this.audio.src = this.defaultSong.url
        $('.bg').remove()
        $('body').append('<div class="bg"></div>')
        this.song.picture ? $('.bg').css({backgroundImage: 'url(' + this.song.picture + ')'}) : $('.bg').css({backgroundImage: 'url(' + this.defaultSong.picture + ')'})
        this.$container.find('figure').remove()
        $('#page-music .aside').prepend('<figure></figure>')
        this.song.picture ? $('figure').css({backgroundImage: 'url(' + this.song.picture + ')'}) : $('figure').css({backgroundImage: 'url(' + this.defaultSong.picture + ')'})
        this.song.title ? $('.detail h1').text(this.song.title) : $('.detail h1').text(this.defaultSong.title)
        this.$container.find('.detail .tag').text(this.label)
        this.$container.find('.author').text(this.song.artist)
    },
    loadLyric: function(sid) {
        $.getJSON('//jirenguapi.applinzi.com/fm/getLyric.php', { sid: sid }).done((response) => {
            let lyricObj = {}
            let lyric = response.lyric
            lyric.split('\n').forEach(function(line) {
                let times = line.match(/\d{2}:\d{2}/g)
                let str = line.replace(/\[.+?\]/g, '')
                if (Array.isArray(times)) { 
                    times.forEach(function(item){
                        lyricObj[item] = str
                    })
                }        
            })
            this.lyricObj = lyricObj
        })
    },
    updateTime: function() {
        let currentTime = this.audio.currentTime
        let min = Math.floor(currentTime/60) + ''
        let second = Math.floor(currentTime % 60)
        second = second < 10 ? '0' + second : '' + second
        this.$container.find('.currentTime').text(`${min}:${second}`)
        let currentLine = this.lyricObj['0' + min + ':' + second]
        if(currentLine) $('.lyric p').text(currentLine)
    }
}

Footer.init()
Fm.init()
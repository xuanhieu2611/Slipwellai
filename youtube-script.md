Wednesday 6:40 PM

Pasted text.txt
Document
I found this youtube video, i like his idea, i think a lot of people would also agree with this idea and found this helpful. I want to make it become an app. From this transcript of the video, you should get a sense of what type of app is this? also here's the description: "ols. They're great. The problem is friction. Getting information INTO a system is what always made me abandon it, and no tool tied together everything I have to manage: YouTube videos, client websites, marketing campaigns, my businesses, my family, and everything in between. So I built one app that does all of it. In this video I walk through the whole thing:

Frictionless capture from my Apple Watch, iPhone, and desktop using voice and text (AI cleans it up and files it for me)
A Today dashboard with my top 3 tasks, Google Calendar sync, and a "slipping" view that flags anything I've let sit too long
Separate routines and streak tracking so my daily habits aren't buried in my task list
Real project management that finally handles BOTH one-time projects and ongoing monthly retainers
A content pipeline for tracking videos and articles from idea to published
A personal CRM for remembering what matters about the people in my life
A library for notes, journal entries, book highlights, and quotes, all searchable and able to resurface on their own
Push notifications, global search, and a built-in AI chat that answers questions from everything in my system

I also break down exactly how I built it: starting with a conversation in Claude, turning it into a spec document, designing it in Claude Design, then building and shipping it with Claude Code. It's hosted as a Node.js app with a Supabase database, accessible from any device. This wasn't one click and ship, but in a couple of days I had a system that was impossible to build with any other tool and still have it stay out of my way."

Do you think that this is something that worth building to make money? Is there any competitor out there?
Deep research

Wednesday 10:35 PM
If i do want to build this, what should be the name for the app?

If i do want to build this, what should be the name of the app?

Hey, it's Jared. After years of trying
0:01
to put together my own productivity
0:04
system, I finally decided to build one
0:07
in Claude Code. And if you've watched
0:09
any of my videos in the past, you've
0:11
seen different things that I've done
0:12
with Notion and different apps that I've
0:14
used, whether it be on an iPhone or an
0:17
iPad or an Android phone. I've I've
0:19
jumped around quite a bit just trying to
0:21
figure out the way that would be best to
0:23
get the information that I need into a
0:26
tool so that I can keep myself
0:28
organized. Now, I have a couple
0:30
different areas in my life that I have
0:32
to jump between. And that might be
0:34
making YouTube videos. It might be
0:36
building websites or working on
0:37
marketing campaigns for clients. And
0:39
then there's uh my family and everything
0:41
else. And I've got all of these
0:42
different things that I want to manage.
0:44
But no tool has really been able to tie
0:47
everything together for me. And so I
0:50
decided to give it a go and see if I
0:52
could build something out in Cloud Code.
0:54
And let me just show you how it works to
0:56
capture some of the information and the
0:59
the frictionless. This is where it
1:01
really works for my life. The friction
1:04
of getting information into a system is
1:06
what prevents me from using the actual
1:08
system. And I've talked about this in
1:10
other videos, but this system is about
1:12
as frictionless as you can get right
1:15
now. So, first things first, I have my
Apple Watch Capture
1:17
Apple Watch on my wrist and I have a
1:20
shortcut here. All I have to do is tap
1:22
on this shortcut and then choose uh
1:24
capture to dashboard. And then I can do
1:27
something like this.
1:30
Schedule a task for home to change out
1:34
the water filter and the refrigerator at
1:36
2 p.m. tomorrow.
1:40
And then I hit done and it's going to go
1:42
ahead and capture that to my dashboard.
What I Built
1:45
Now, this is a complete tool that I'm
1:48
going to walk through and show you some
1:49
of the features. I'm going to talk about
1:50
how I built it, but ultimately I have
1:53
all these different areas of my life,
1:54
whether it be home or work, which facet
1:57
of my work, different other things that
1:58
I'm involved in. And all of those things
2:01
could be projects, but they're not just
2:03
projects. They're also areas. And some
2:06
projects are time based. Like I might be
2:08
working on something for a deliverable
2:10
that might last a couple of weeks or a
2:12
month. And then there are some ongoing
2:14
type of projects that have recurring
2:17
tasks every month. These were challenges
2:19
that I couldn't really overcome in
2:21
notion or other tools. I could build
2:24
something out, but it would become so
2:26
elaborate and overdone that the friction
2:28
to getting the information into the
2:30
system was just too much at times, which
2:32
means I wasn't going to use it. So, if
Desktop Interface
2:34
we jump over to the web interface here
2:37
and I go ahead and click on tasks, I
2:39
could just refresh the page here. Click
2:41
on tasks. You can see here we've got
2:43
change out water filter and
2:45
refrigerator. It assigned it to home,
2:47
gave it a due date of tomorrow at 2 p.m.
2:51
I didn't tell it to to give me a
2:52
reminder. Otherwise, it would have given
2:54
me a reminder. So, we'll just go ahead
2:56
and set a reminder for it. That's
2:57
something that I'm I'm going to adjust
2:59
to have it just automatically add a
3:01
reminder unless I tell it not to. So,
3:04
then that's saved. This is not an actual
Dashboard iPhone Web App
3:07
app. Like, I didn't develop an app. This
3:09
is a web app that I saved to my home
3:12
screen. And it loads things up. You can
3:14
see I have a notification right here
3:16
letting me know that I just added a new
3:19
task. And so if I click on that, I can
3:22
see task created. And so any new item
3:25
that I add is going to be in here just
3:26
so that I can easily see the items that
3:29
I recently added to my system. And I can
3:32
tap on this, of course, and uh and edit
3:34
it the same way that I did on my desktop
3:37
computer. But you'll notice here on the
3:39
phone, we have a couple of different
3:40
ways that we can enter things into the
3:43
system as well. Of course, on the Apple
3:45
Watch, that's not an app. That's simply
3:47
a shortcut that, uh, runs on the Apple
3:50
Watch, uh, triggers a few things,
3:52
records the voice, transcribes the voice
3:54
into text, ingests that into, uh, the
3:57
system using AI, and it would rewrite
4:00
that appropriately. So that way, it's
4:01
not just my blurb of text. Like, it's
4:04
not going to also include my H or ums,
4:06
like if I'm kind of thinking out my
4:08
process. it's actually going to filter
4:10
all of that out and rewrite it and put
4:11
it into the system assigning it where it
4:14
needs to go uh appropriately. So I don't
4:16
have to go in there and do that
4:17
manually. Of course, the reason for the
4:19
notifications is so that I can go and
4:21
check just to make sure. Have a really
4:23
quick way of looking and saying, "Oh
4:24
yeah, all the things that I added today
4:26
went where they're supposed to go." But
4:27
there's so much more that this can do.
4:30
It's not only my task and project
4:32
manager, but it's how I manage things
4:35
that I want to remember about people and
4:37
different interactions. There's a
4:38
library that includes my notes, journal,
4:43
and all sorts of other things. We'll get
4:45
into that here in a second. Here's some
4:47
recent entries. And one of those recent
4:49
journal entries would be about how we
4:51
spent Memorial Day. And if I tap on
4:53
that, uh, we've got exactly what we did.
4:55
We've got some photos that I took on my
4:58
device as well. This was also added via
5:00
voice. And then I came back and uploaded
5:02
a couple of photos so that I can have
5:04
those in this journal entry. And so from
5:07
the web app on my phone, I can use voice
5:10
entries in a similar way that I did on
5:12
the Apple Watch. So let's go ahead and
5:13
enter another task. Add a task to home
5:17
to check the oil on the car tomorrow at
5:20
400 p.m. Set an alert for 5 minutes.
5:31
All right. And then we'll go ahead and
5:33
check. And we can see here that it set
5:35
the alert for 5 minutes before and
5:38
scheduled that task. And so I can do
5:39
that via voice here. This isn't actually
5:41
using a shortcut. This is going directly
5:43
into the interface. And then I also have
5:46
the ability to enter things via text as
5:49
well for those instances where I don't
5:51
want to speak into the microphone. So
5:53
let's take a look at the browser
Today Dashboard Overview
5:55
interface. I have my today screen here,
5:57
which gives me my top three tasks for
5:59
the day. These are the three things that
6:01
I want to accomplish every day. And then
6:03
any other tasks that I get done can come
6:05
after that. I can add a task to my top
6:08
three by going ahead and tapping the
6:10
star and it goes ahead and adds that up
6:12
here. And then when I get items done, I
6:14
can check them off. I also have my
6:17
calendar entries. And this is actually
6:19
pulling in from Google Calendar. My
6:21
tasks and projects are actually built
6:23
into the system and managed within this
6:25
system. But I'm not going to change
6:27
using Google Calendar. There's too many
6:28
good things about using that standard
6:30
calendar. So, this simply pulls in
6:32
everything from Google Calendar using
6:34
the Google Calendar API and it all runs
6:36
in the background and updates whenever
6:38
there are new things added. And then
6:40
down here we have all open tasks and
6:42
they're sorted by due date. Over on the
6:44
right hand side we have this area called
6:46
slipping. Now, one of the things that
6:48
was a struggle for me is if there was a
6:50
project that I didn't get some work done
6:53
in a certain amount of time, there was
6:54
no easy way for me to be notified unless
6:57
I simply scheduled reminders in there to
7:00
remind me to check in on it. Now, there
7:02
are some ways to do this in project
7:04
management tools, but it's very specific
7:06
to a certain type of workflow, and it's
7:09
not flexible across all areas of my
7:11
life. I always found myself trying to
7:13
fit personal tasks and different things
7:15
into a system that was built for
7:16
business workflows so that I could have
7:18
everything in one place and it just
7:20
didn't work out too well. So, this area
7:22
will update if a project goes with a
7:24
certain amount of time without having
7:26
been looked at or worked on. And it's
7:28
not just projects, it's also tasks and
7:31
other areas as well. I have my routine
7:34
checklist here. Now, what I used to do
7:36
was put my routine items like take my
7:39
vitamins, check my email, and stuff like
7:41
that. Those daily routines would just
7:43
also be reminders. And so, I'd have all
7:45
of those mashed together with tasks and
7:48
other reminders, and it was just a big
7:50
mess. And so, I'd open that up and it's
7:52
like, man, what an overwhelming vat of
7:55
stuff that I've got to go through. Okay,
7:57
a lot of those are just routine type of
7:59
things. Maybe I can sort those a
8:01
different way or set up different views,
8:03
but then I've got to jump around and
8:04
there is no easy global way to look at
8:07
everything without everything being all
8:08
jumbled together in some sort of unified
8:10
inbox. And so now I can view all of
8:13
these items here separately. I can
8:16
toggle these off and you can see I have
8:17
a streak tracker over here on the right
8:19
hand side. And this particular task was
8:21
scheduled for the morning. And you can
8:23
see that since it's in the afternoon,
8:25
we've missed the morning. And I'm going
8:27
to go ahead and toggle this one off. And
8:29
that updates the street tracker and then
8:32
crosses it off and I have just my
8:35
evening routine tasks left. Now down
8:37
here under resurfacing one journal entry
8:40
quote or saved verse rotates here daily.
8:43
Right now one is not populating in here
8:45
but I can have a a quote saved from a
8:48
book or some sort of note that I favored
8:50
will show up in this section and it'll
8:52
rotate giving me a new piece of
8:53
inspiration every single day. If I
8:55
scroll down there's items that need my
8:57
review. Perhaps I created a note and
9:00
there was some sort of action item in
9:01
that note that was identified by AI as
9:04
needing to be reviewed at a later date.
9:06
It's going to go ahead and automatically
9:08
check that for me and it'll show up in
9:10
this section. And that way I don't miss
9:12
out on something that I logged that I
9:13
wanted to revisit later because I know I
9:15
have so many notes that I had in my
9:18
Apple Notes app or in Notion that I
9:20
entered and then they just go there to
9:22
die. There's nothing there that would
9:24
invoke me to revisit that. This system
9:26
solves for that. And then down at the
9:27
bottom, we have those notifications as
9:29
well. Now, there's a keyboard shortcut
9:31
on the computer, command J, which is
9:34
that text capture. So, just like I
9:36
showed you the text capture on the
Capture & Search Methods
9:38
phone, I can do that easily on the
9:39
computer. I also have a global search
9:42
option. So, I can come in here and
9:44
search for something like say I'll just
9:46
search for daughter, maybe something
9:47
about my daughter. And then I have any
9:49
notes that mention that, any quotes that
9:52
mention that, and of course any other
9:54
section from my library that would
9:56
mention the word daughter is going to
9:57
show up there. I can also ask, and since
10:00
this system is using the anthropic API,
10:03
I can chat with all of the information
10:05
that's in my system here. So any
10:07
information in my database within this
10:10
dashboard, I can chat and get answers
10:12
back from it. And so as I add more and
10:14
more information to this, there's going
10:16
to be more context for it to work from.
10:18
And it already has a ton of context
10:20
because I imported all of my notes from
10:22
my other notes applications. And so
10:24
there's hundreds of notes already in
10:25
here and quotes from books and journal
10:27
entries that I've been accumulating over
Settings & Integrations
10:29
time. And then there's a settings page,
10:31
which this is where I would make sure
10:33
that my connection to Google Calendar is
10:35
working and I can see when it was last
10:37
synced. And I can force a sync if for
10:39
some reason things don't seem updated. I
10:41
could change my time zone if I want. And
10:42
then I can check all the integration
10:44
connections and make sure that they're
10:46
working as well. So I get a little check
10:47
mark here to let me know that everything
10:49
is connected and working. This would be
10:51
the first place that I would go if
10:53
something just wasn't working the way
Managing Tasks
10:54
that it should. So if we go under tasks,
10:56
I have a whole bunch of different sort
10:58
options. I can sort by open, done, or
11:00
all. And by project or area as well. And
11:03
you can see it sorts all of these by
11:05
when they're due. And if I click on one
11:07
of those, we have that interface that we
11:09
already looked at. But I can connect
11:11
these to a project/ area. So whether
11:14
it's a work project or an area of my
11:16
life, I can connect the task to that. I
11:18
can set a priority as well. I can also
11:20
connect these to a content item. And
11:22
we'll talk about content items here in a
11:24
second. I can set reminders. And these
11:26
reminders actually send push
11:28
notifications. So if I go back to my
11:30
iPhone and unlock it, and let's just
11:32
swipe down from the top here, you can
11:34
see pushover. It's actually an app and
11:37
an API that allows me to connect my
11:40
dashboard system to pushover and then it
11:43
sends push notifications. So you can see
11:45
here two hours ago, which would have
11:46
been noon, I got a notification that I
11:49
didn't start my journal entry. That was
11:51
that routine item on the today page that
11:53
we saw that was missed. I got a
11:55
notification about that. I also got
11:56
notifications about other tasks. And
11:59
then I also get a daily summary. And I
12:02
can come into the app and see all of
12:04
those notifications as well. How neat is
12:05
this that I can see all of my tasks and
12:08
their schedules right here without
12:10
having to scroll through a massive list.
12:12
I could just look at everything and say,
12:13
"Okay, this is what my morning is going
12:15
to look like based on how I scheduled
12:18
out my tasks for the day. So, very easy
12:21
to organize all of those things and get
12:23
those notifications so that I don't miss
12:25
anything. And you can also see here that
12:27
I have the ability to set tasks as
12:28
recurring. So that way a task will just
12:30
be automatically generated again once I
Managing Routines
12:33
complete it. Now routines is a huge one
12:35
and I already talked a little bit about
12:37
the separation of routines and tasks. I
12:40
have a set of routines that I'm going to
12:41
go through every single day and I want
12:43
to be able to look at those morning,
12:45
afternoon, and evening and check those
12:46
off. But I also have routines that I
12:49
might want to do for a certain period of
12:51
time. Think about those streak tracker
12:52
apps that allow you to set up a 30-day
12:55
streak for something uh or just set an
12:57
ongoing streak so that you can check
12:59
those items off every single day. That's
13:01
essentially what this is. But I can use
13:03
it in both of those ways. I just simply
13:05
give it a name, a description if I'd
13:07
like, the time of day, whether it's
13:08
morning, afternoon, or evening, or
13:10
anytime. I can set a specific time if I
13:13
would like, choose whether or not I want
13:14
it to send a notification, and then if
13:17
this is an ongoing streak or if it's for
13:19
a specific time frame, and then I can
13:21
manually type in a custom amount of
13:23
days, too, if I would like. So, for
13:25
example, in June, I want to run a 5K
13:28
every single day for the month of June.
13:30
And so, I can set a 30-day recurring
13:33
routine that will start on the first day
13:35
of June. And I can check those off. And
13:37
then after that's over, I will have
13:39
archived items that start to show up
13:41
below. So I can go and view all of my
13:44
completed streaks, which will be fun to
13:46
see over time. And then I have this bar
13:47
graph up here that's going to update.
13:50
Obviously, I just added this feature
13:52
about five or six days ago. And so I
13:54
just have a little bit of data here, but
13:56
I'll be able to see the eb and flow of
13:58
my progress with trying to maintain
14:01
habits and routines. Now projects, this
Managing Projects
14:04
is an area that was a huge struggle for
14:06
me when I was using notion. I have
14:08
active projects and retainers and
14:12
different areas of my life. A project is
14:14
something that has an end date. It might
14:16
be a website that I'm building for a
14:17
client and after about 30 days I'll be
14:19
done with that. There's things that I
14:21
need to track in regards to that
14:23
project. And then there's retainer
14:24
items. There's clients that I do ongoing
14:26
work for and it was always hard to use a
14:29
standard project management system for
14:31
that because a retainer often has things
14:33
that recur every single month and I'd
14:35
have to go in and manually create either
14:38
recurring tasks or I'd have to manually
14:40
add new items every single month and it
14:42
was just a real chore to get that done.
14:44
So, if I'm looking at a one-time
14:47
project, I can set milestones in here. I
14:50
can add new milestones and it gives me a
14:52
percentage of completion on those
14:53
milestones. I can also add tasks here
14:56
which go into my main tasks database or
14:59
my main tasks area, but then they're
15:01
also linked to this project. I can add
15:04
checklists. And what's great is I can
15:06
create checklist templates as well. So
15:09
when I create a new project, if it's for
15:11
building out a website, there might be a
15:13
certain amount of things that I go
15:14
through every single time. Checklist
15:16
like like make sure I get access to the
15:18
domain name, set up the hosting
15:20
environment, install WordPress, whatever
15:21
it is that I'm going to be doing through
15:23
that process. I can just go through that
15:25
checklist and I don't have to add that
15:26
every single time. And then I can also
15:28
log my activity as well, like what have
15:30
I been working on, how long have I been
15:32
working on it, and then it will update
15:35
here in the hours showing me how many
15:37
hours I've worked on that project, which
15:39
time tracking is good just to make sure
15:40
that I'm not spending too much time on a
15:42
project because I'm definitely prone to
15:44
that. And then if it is a project where
15:46
I'm actually billing for my hours, I'm
15:48
tracking all of that information here.
15:49
But then there's also retainer items as
15:51
well, which has open tasks that I might
15:54
do every single month and also checklist
15:57
items. And these are things that I do
15:59
every month. And so if I had to come
16:00
back and add these things again, whether
16:02
it be weekly or monthly, it would be
16:04
timeconsuming. And this area works a
16:06
little bit differently in the sense
16:07
where I set things up recurring, whether
16:09
they're tasks or checklist. It's going
16:11
to automatically reload those at the
16:13
beginning of the month, and it'll also
16:14
save the ones that might have been
16:16
overdue. And then I have a section that
16:18
falls outside of projects. They're not a
16:20
typical project that I'd be working on
16:22
for someone else, but it's an area in
16:24
which I spend time, whether it be in the
16:26
home or with Hill Media Group or other
16:28
projects of mine. It makes it really
16:30
easy for me to add tasks and assign them
16:32
to something for organization. And even
16:34
to be able to go back and look and see
16:36
the history is great as well. When I go
16:38
to create a new project or a new area, I
16:41
have those two options up here. A new
16:43
project can be a project or it can be an
16:46
area project. And then under engagement,
16:48
it could be a project or a retainer. So
16:51
I can just simply change these and
16:53
everything updates here on the fly
16:55
giving me different options. And when it
16:57
saves everything, it saves it
16:58
accordingly so that the project will
17:00
work the way it's supposed to moving
Content Manager
17:02
forward. Now the content section is more
17:04
specific to me as a person who creates
17:06
YouTube videos and writes article
17:08
content. I have videos that I'm working
17:10
on here and I can keep tabs on my videos
17:14
where they're at, whether they're
17:16
published or editing or I'm waiting on
17:18
something. It makes it really easy for
17:19
me to see what I'm working on. Now, I
17:21
had built something like this in Notion
17:23
and it perhaps was the most useful part
17:25
of Notion for me was just keeping tabs
17:28
on where I'm at on different videos, but
17:30
this is much cleaner and it integrates
17:32
with my tasks, project management, and
17:34
having everything allin-one definitely
17:36
makes it easier. So, this is a published
17:38
video. This is the actual YouTube video
17:40
embedded here. And then tasks that are
17:42
associated. I don't have any tasks.
17:44
They're all completed. Here's a
17:45
checklist that I went through of the
17:47
process from outlining to publishing and
17:50
promoting the video. I've got the title,
17:52
what type of content it is, video,
17:54
article, podcast, newsletter. I've got
17:56
the publish status here. But if it's not
17:59
published yet, maybe it's an idea. I
18:01
haven't even started working on it yet.
18:02
I can leave it in the idea status or
18:04
move it through the different statuses
18:06
here and then move it on to done when
18:09
I'm done with the video which
18:10
essentially this one is done. I can
18:12
connect it to a specific channel or
18:14
domain and so I have my different
18:16
YouTube channels and different life
18:18
domains here as well. So couple of
18:20
YouTube channels in here my substack
18:22
hill media group and so I can assign the
18:24
content to one of those different areas.
18:26
I could put the video URL if there is
18:28
one or the article URL. Here's the
18:31
publish date. And then there's a box
18:32
down here that supports markdown that
18:34
allows me to work on my outline and have
18:37
all of that information here. So I have
18:38
all the information about this video or
Managing People
18:40
article in one spot. And then I have the
18:42
people section which is my relationships
18:44
database. And this is kind of like a
18:45
personal CRM. Now in one of my recent
18:47
posts to Substack, I mentioned wanting
18:49
to be more intentional and trying to do
18:51
better at memorizing and remembering
18:54
important information about the people
18:55
closest to me. And I improved that
18:57
process by actually writing those things
18:59
down in my journal. I have a daily
19:01
journal that I handwrite and I write
19:03
down information there. I feel like
19:05
writing things down with a pen and paper
19:07
is one of the best ways to commit that
19:09
to memory. But then it's in a journal,
19:10
maybe several pages back, maybe it's in
19:12
an earlier edition of one of my journals
19:14
that's now on the shelf. That
19:16
information is not readily available to
19:18
me. So I put that information into this
19:20
system. And to give you an idea of what
19:21
that looks like, I can log information
19:23
in here that might be facts about that
19:25
person, like a birthday, anniversary,
19:28
something about one of their kids, a
19:29
shared interest, a follow-up, or
19:31
something like that. And then I can also
19:32
log interactions that I've had with them
19:34
as well. Now, I'm not going to get too
19:36
carried away with this, but I am going
19:38
to put important things in there that I
19:39
don't want to forget. So that way, if
19:41
there's something that comes to my mind
19:43
about that person, I'm not going to
The Library
19:44
forget it. Now, if I jump down to
19:46
library, this section has a lot going
19:48
on. Now, I like to keep tabs on notes,
19:50
journal entries, and quotes that I
19:53
found, whether they be in a book or from
19:54
a podcast or something that I heard. And
19:57
I also read a lot of books on Kindle,
19:58
and I highlight different items that I
20:00
want to remember there as well. And I
20:02
wanted a place where all of these things
20:04
could come together and live, and I can
20:06
access all of them. So, under my
20:08
library, I can view all of my notes,
20:10
which includes journal entries, quotes,
20:12
and all sorts of stuff. But then I can
20:14
come through and view these individually
20:16
and they all have sorting that is
20:18
specific to that content type. So under
20:21
notes I have the source like where did
20:23
it come from and then I also have tags
20:26
that can be added to this as well. And
20:28
so when I view one of these, this was
20:30
something that I added in a concept from
20:32
a book that I was reading. And so I can
20:33
associate that to that book. I can add
20:35
some tags. I can flag it for review if I
20:38
want to come back. I can even add an
20:39
image. I can then go to quotes. And this
20:42
is all quotes with their own specific
20:44
sorts as well. I could even sort by book
20:46
and whether or not it was from an
20:48
article, podcast, a conversation, or
20:50
anything like that. And then there's
20:51
also tags specific to these as well. And
20:54
when I click on one of these, I can view
20:56
the quote. I can also view my thought
20:58
about the quote as well. And I can add
21:00
multiple thoughts. And so I can add a
21:02
feed. So, as I revisit quotes and maybe
21:04
think about things differently or how I
21:06
might have implemented something from
21:08
that into my life, I can put that in
21:10
here and keep tabs on that, which is
21:12
super useful. There's a little bit less
21:14
here with the journal entry. A journal
21:15
entry is just a entry of text and maybe
21:18
a couple of photos or a small video clip
21:21
just like this. And most of these are
21:23
going to be added via voice. And so most
21:25
of the time I am journaling in an actual
21:28
written journal with a pen and paper.
21:29
But like I said, that paper ends up
21:31
going on the shelf and it's not easy to
21:32
go back and revisit those things. And so
21:34
if there's anything insightful from a
21:36
specific day, something that I want to
21:38
remember, I'll go ahead and enter it
21:39
here. And the next thing I'm working on
21:41
is actually just being able to take a
21:42
picture of that page and have AI
21:44
automatically pull out all of those
21:46
insights and automatically add them into
21:48
the journal for me. any book that I've
21:50
read, especially Kindle books, it's
21:52
really easy to pull those in.
21:54
Automatically have the book cover pulled
21:56
in as well with the title, the author,
21:58
the cover image, the status of the book,
22:00
whether I want to read it, I'm reading
22:02
it, finished it, or I abandoned the
22:04
book, what the format was, when I
22:06
started reading the book, when I
22:07
finished reading the book. I can give it
22:09
a rating. I could even put in the ISBN,
22:11
which isn't super useful for this, but
22:13
it's information that could be pulled
22:14
in. And then I can give my summary and
22:17
notes on the book here. And then it's
22:19
also going to show all of the individual
22:21
highlights. And all of these highlights
22:23
are individual quotes which then can
22:25
have their own thoughts underneath them.
22:27
And all of these highlights are
22:28
automatically pulled in when I save one
22:30
of those highlights in a Kindle book.
22:31
When I'm done with that book, I can then
22:33
sync all of those over into the system.
22:35
And then I have all of them here. And
22:37
when I view one of these quotes, I can
22:38
come in and add some thoughts to it as
22:40
well. And then the inventory section,
22:42
which I haven't built out yet, is going
22:44
to make it easy for me to keep tabs on
22:47
all of the different things that I own.
22:49
Think about the situation where you end
22:51
up having a house or an office fire. And
22:54
you have to go through and try and
22:55
remember all of the different things
22:57
that you had and make an inventory list
22:58
to provide to insurance. I want to make
23:00
that extremely easy using this system
23:03
where I can log all of that stuff, have
23:05
a photo of it, and make it really easy
23:08
should I have any issue. But it's not
23:09
only just for that. It's also just to
23:11
make sure that I don't end up having
23:12
things sitting around that I'm no longer
23:14
using. I can go in here and look at the
23:16
date that it was added in. And then I
23:18
can also pull things out of inventory as
23:20
well. And I don't want to have a bunch
23:21
of stuff sitting around that I'm not
23:23
using, especially if it's something that
23:25
I could sell while it still has some
23:26
value. And this system is going to help
23:28
me be a better steward of the things
23:29
that I purchase and a steward of my
23:31
resources for when it's time to get rid
Managing Domains
23:33
of them. Lastly, we have the different
23:35
domain areas of my life. And this is the
23:37
highest level in which all things are
23:39
connected. There's domains, projects,
23:41
tasks, and routine. And all of those
23:43
trickle down from a domain area. And so
23:45
the domain areas would be my field
23:48
notes, Hill Media Group, a couple of my
23:50
different YouTube channels, my
23:52
photography business, site, Nitro. And
23:54
so these are the top level areas in
23:56
which everything else falls within
How I Built This in Claude Code
23:57
individually. Now, like I said, I built
24:00
this in Claude. And so initially I
24:02
started out in a claude chat talking
24:04
about the different areas of my life and
24:06
the ways that I organize things. We had
24:08
a conversation about that and I had it
24:10
ask me questions so that it can better
24:12
understand how I want to organize things
24:14
because it's really hard to kind of map
24:16
all that stuff out and I could do it on
24:18
paper but having a conversation with a
24:20
claude chat was what helped me kind of
24:22
figure out how those things need to be
24:24
organized and verbalize those things and
24:26
then have it come back and say, "Well,
24:28
it might be kind of hard to tie those
24:29
things together. what about this? And
24:31
I'd say, nah, that doesn't work for me.
24:32
And we'd work towards something that
24:34
ended up working out. And the result of
24:36
that was a full spec document that we
24:39
created that had everything that this
24:41
tool needed. From there, we took the
24:43
spec document and then brought it into
24:45
Claude Design. And in claw design is
24:48
where we worked on all of the design
24:50
aspects and everything about the system,
24:53
including what each of the pages were
24:54
going to look at, the voice capture
24:56
flow, what that was going to look like,
24:58
the different domain areas, how projects
25:00
were going to look, the content
25:02
pipeline, and everything else. Now,
25:04
there's some features that haven't been
25:06
completely built out yet, like the
25:07
cananban view of content. I don't have
25:10
that built out yet. And like I said, the
25:11
inventory hasn't been built out either.
25:14
But after we figured out this design, I
25:16
had a bunch of design files and I was
25:18
able to download those files and then
25:20
upload the design files and the scope
25:22
document into Claude Code and start
25:24
building. Now, it wasn't one click and
25:26
ship. It wasn't ready to go initially
25:29
without a whole bunch of chat. You can
25:31
see here that as I scroll through the
25:34
entire chat that I've had with Claude on
25:37
building this out, it is quite an
25:39
interaction and it's involved everything
25:41
from getting started with the initial
25:43
files to the dashboard that would run
25:45
locally on my computer into getting
25:47
everything moved into a web interface
25:49
that would allow me to connect to it
25:50
whether I was on my home network
25:52
connected to the laptop or I was out
25:53
running around only with my Apple Watch.
How I'm Hosting It
25:56
Now I'm hosting this NodeJS project with
25:58
excloud. I use ExCloud for hosting a
26:01
bunch of websites, including a bunch of
26:02
my client websites, and it's worked out
26:04
really well. It's not the perfect
26:06
environment for what I'm doing here, but
26:08
it works really well and it's been super
26:10
stable. It's been really easy to push
26:12
features and updates from cloud code
26:14
directly to the platform and then have
26:15
features ready to use regardless of
26:17
which device that I'm on. The database
26:19
is running in Superbase and so Superbase
26:21
is where all the data is stored and then
26:23
excloud is where the infrastructure is
26:25
hosted and accessed from. And then I
26:27
connected everything to an actual
26:29
website address so that it's easy for me
26:31
to access this from anywhere. And it's
26:32
username and password protected along
26:34
with authentication to keep everything
Conclusion
26:36
safe. So I know for a fact that there's
26:38
no other tool out there that will do
26:40
something like this without writing a
26:42
bunch of code or customizing something
26:43
into oblivion where the friction to
26:45
actually using the system becomes so
26:47
great that you end up needing to abandon
26:49
it. That's been my track record with
26:50
other tools that are out there. They're
26:52
great tools, but their use case isn't
26:54
for someone's entire life. and I don't
26:56
want to be jumping around between
26:57
different tools. So, I decided to build
26:59
my own. And because I have a little bit
27:00
of a development background and can
27:02
think that way and have access to clawed
27:04
code, I was able to develop this entire
27:06
system within a couple of days and start
27:08
implementing it into my life. And so,
27:10
I'm making this video really just to
27:11
share that the possibilities are kind of
27:13
endless these days. There are so many
27:15
different things that you can do. In a
27:16
matter of a couple of days, I built a
27:18
system that was impossible for me to
27:20
build with any other tool and still have
27:22
it be useful. I'm able to access that
27:24
from either my computer, my phone, a
27:26
tablet. I'm able to post updates to it
27:28
from my watch. These are things that I
27:29
couldn't do with any other tool. And for
27:32
me, these tools aren't about
27:33
implementing my life into them. It's
27:35
trying to be the best steward of the
27:36
things that I have in my life and make
27:38
sure that I stay organized so that
27:40
nothing slips through the cracks. The
27:41
tools should get out of my way so that I
27:43
can stay focused and not spend half of
27:45
my day trying to figure out where I'm at
27:47
on a project or what needs updating. So,
27:49
I'll probably share a few additional
27:51
things about this in my Substack. So, if
27:53
you're interested in that, make sure to
27:54
check out the link in the description
27:56
and subscribe to that for free. If you
27:57
have any questions about what I built,
27:59
I'll try to answer them in the
28:00
description below. But, if I could give
28:01
you one piece of advice on getting
28:03
started with something like this, it's
28:04
just to go into a cloud chat and start
28:06
having a conversation. Share the things
28:08
that you're trying to accomplish.
28:10
Explain them. Talk about how you're
28:12
doing them right now and what friction
28:14
points there are, frustrations that
28:15
you're experiencing all the time, and
28:17
work on figuring out what a system would
28:19
look like that would work specific to
28:21
your needs. and then eventually start
28:22
working on a scope document. And once
28:24
you have that document, look through it,
28:26
spend some time with it, and figure out
28:27
if it's going to solve all of your
28:29
problems or if it's simply going to add
28:31
to them. Because you could really easily
28:32
create something that becomes a friction
28:34
point and a frustration in your life
28:36
once again, and you don't want that. But
28:37
that's where I'm going to end this video
28:38
for today. Thanks so much for watching.
28:40
Hope you enjoyed it. Give it a thumbs
28:42
up, subscribe to the channel, and we'll
28:43
see you back soon. Take care.

Close

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Helper to create a stable placeholder cover URL per track
function coverUrlFor(title, artist) {
  const seed = encodeURIComponent(`${title}-${artist}`);
  return `https://picsum.photos/seed/${seed}/300/300`;
}

// Expanded track library with 70+ tracks across multiple genres
const tracks = [
  // Classic Rock
  { title: 'Like a Rolling Stone', artist: 'Bob Dylan', album: 'Highway 61 Revisited', duration_seconds: 366, genre: 'Rock', votes: 15, cover_url: coverUrlFor('Like a Rolling Stone','Bob Dylan') },
  { title: 'Gimme Shelter', artist: 'The Rolling Stones', album: 'Let It Bleed', duration_seconds: 271, genre: 'Rock', votes: 12, cover_url: coverUrlFor('Gimme Shelter','The Rolling Stones') },
  { title: 'Stairway to Heaven', artist: 'Led Zeppelin', album: 'Led Zeppelin IV', duration_seconds: 420, genre: 'Rock', votes: 18, cover_url: coverUrlFor('Stairway to Heaven','Led Zeppelin') },
  { title: 'Sympathy for the Devil', artist: 'The Rolling Stones', album: 'Beggars Banquet', duration_seconds: 382, genre: 'Rock', votes: 10, cover_url: coverUrlFor('Sympathy for the Devil','The Rolling Stones') },
  { title: 'God Only Knows', artist: 'The Beach Boys', album: 'Pet Sounds', duration_seconds: 177, genre: 'Rock', votes: 8, cover_url: coverUrlFor('God Only Knows','The Beach Boys') },
  { title: 'Born to Run', artist: 'Bruce Springsteen', album: 'Born to Run', duration_seconds: 269, genre: 'Rock', votes: 14, cover_url: coverUrlFor('Born to Run','Bruce Springsteen') },
  { title: 'Be My Baby', artist: 'The Ronettes', album: 'Presenting the Fabulous Ronettes', duration_seconds: 155, genre: 'Rock', votes: 7, cover_url: coverUrlFor('Be My Baby','The Ronettes') },
  { title: 'Hotel California', artist: 'Eagles', album: 'Hotel California', duration_seconds: 391, genre: 'Rock', votes: 16, cover_url: coverUrlFor('Hotel California','Eagles') },
  { title: 'Sweet Child O\' Mine', artist: 'Guns N\' Roses', album: 'Appetite for Destruction', duration_seconds: 356, genre: 'Rock', votes: 13, cover_url: coverUrlFor("Sweet Child O' Mine",'Guns N\' Roses') },
  { title: 'Bohemian Rhapsody', artist: 'Queen', album: 'A Night at the Opera', duration_seconds: 355, genre: 'Rock', votes: 20, cover_url: coverUrlFor('Bohemian Rhapsody','Queen') },
  { title: 'Thunder Road', artist: 'Bruce Springsteen', album: 'Born to Run', duration_seconds: 293, genre: 'Rock', votes: 9, cover_url: coverUrlFor('Thunder Road','Bruce Springsteen') },
  { title: 'Church & State', artist: 'Brandi Carlile', album: 'Returning to Myself', duration_seconds: 245, genre: 'Rock', votes: 5, cover_url: coverUrlFor('Church & State','Brandi Carlile') },
  { title: 'Human', artist: 'Brandi Carlile', album: 'Returning to Myself', duration_seconds: 223, genre: 'Rock', votes: 4, cover_url: coverUrlFor('Human','Brandi Carlile') },
  { title: 'Ashes to Ashes', artist: 'David Bowie', album: 'Scary Monsters', duration_seconds: 254, genre: 'Rock', votes: 11, cover_url: coverUrlFor('Ashes to Ashes','David Bowie') },
  { title: 'Black Dog', artist: 'Led Zeppelin', album: 'Led Zeppelin IV', duration_seconds: 295, genre: 'Rock', votes: 12, cover_url: coverUrlFor('Black Dog','Led Zeppelin') },
  { title: 'Paranoid Android', artist: 'Radiohead', album: 'OK Computer', duration_seconds: 383, genre: 'Rock', votes: 14, cover_url: coverUrlFor('Paranoid Android','Radiohead') },
  { title: 'Whole Lotta Love', artist: 'Led Zeppelin', album: 'Led Zeppelin II', duration_seconds: 334, genre: 'Rock', votes: 13, cover_url: coverUrlFor('Whole Lotta Love','Led Zeppelin') },
  { title: 'Comfortably Numb', artist: 'Pink Floyd', album: 'The Wall', duration_seconds: 384, genre: 'Rock', votes: 17, cover_url: coverUrlFor('Comfortably Numb','Pink Floyd') },
  
  // Pop & Contemporary
  { title: 'Blinding Lights', artist: 'The Weeknd', album: 'After Hours', duration_seconds: 200, genre: 'Pop', votes: 22, cover_url: coverUrlFor('Blinding Lights','The Weeknd') },
  { title: 'As It Was', artist: 'Harry Styles', album: 'Harry\'s House', duration_seconds: 167, genre: 'Pop', votes: 19, cover_url: coverUrlFor('As It Was','Harry Styles') },
  { title: 'Levitating', artist: 'Dua Lipa', album: 'Future Nostalgia', duration_seconds: 203, genre: 'Pop', votes: 17, cover_url: coverUrlFor('Levitating','Dua Lipa') },
  { title: 'Good 4 U', artist: 'Olivia Rodrigo', album: 'SOUR', duration_seconds: 178, genre: 'Pop', votes: 16, cover_url: coverUrlFor('Good 4 U','Olivia Rodrigo') },
  { title: 'Watermelon Sugar', artist: 'Harry Styles', album: 'Fine Line', duration_seconds: 174, genre: 'Pop', votes: 15, cover_url: coverUrlFor('Watermelon Sugar','Harry Styles') },
  { title: 'Flowers', artist: 'Miley Cyrus', album: 'Endless Summer Vacation', duration_seconds: 200, genre: 'Pop', votes: 14, cover_url: coverUrlFor('Flowers','Miley Cyrus') },
  { title: 'Billie Jean', artist: 'Michael Jackson', album: 'Thriller', duration_seconds: 294, genre: 'Pop', votes: 25, cover_url: coverUrlFor('Billie Jean','Michael Jackson') },
  { title: 'Beat It', artist: 'Michael Jackson', album: 'Thriller', duration_seconds: 258, genre: 'Pop', votes: 23, cover_url: coverUrlFor('Beat It','Michael Jackson') },
  { title: 'Purple Rain', artist: 'Prince', album: 'Purple Rain', duration_seconds: 418, genre: 'Pop', votes: 21, cover_url: coverUrlFor('Purple Rain','Prince') },
  { title: 'When Doves Cry', artist: 'Prince', album: 'Purple Rain', duration_seconds: 337, genre: 'Pop', votes: 18, cover_url: coverUrlFor('When Doves Cry','Prince') },
  { title: 'Anti-Hero', artist: 'Taylor Swift', album: 'Midnights', duration_seconds: 200, genre: 'Pop', votes: 20, cover_url: coverUrlFor('Anti-Hero','Taylor Swift') },
  { title: 'Shake It Off', artist: 'Taylor Swift', album: '1989', duration_seconds: 219, genre: 'Pop', votes: 16, cover_url: coverUrlFor('Shake It Off','Taylor Swift') },
  { title: 'Bad Guy', artist: 'Billie Eilish', album: 'When We All Fall Asleep', duration_seconds: 194, genre: 'Pop', votes: 18, cover_url: coverUrlFor('Bad Guy','Billie Eilish') },
  { title: 'Shape of You', artist: 'Ed Sheeran', album: '÷', duration_seconds: 233, genre: 'Pop', votes: 15, cover_url: coverUrlFor('Shape of You','Ed Sheeran') },
  { title: 'Dynamite', artist: 'BTS', album: 'BE', duration_seconds: 199, genre: 'Pop', votes: 19, cover_url: coverUrlFor('Dynamite','BTS') },
  { title: 'Despacito', artist: 'Luis Fonsi', album: 'Despacito', duration_seconds: 229, genre: 'Pop', votes: 14, cover_url: coverUrlFor('Despacito','Luis Fonsi') },
  
  // R&B & Soul
  { title: 'What\'s Going On', artist: 'Marvin Gaye', album: 'What\'s Going On', duration_seconds: 234, genre: 'R&B', votes: 12, cover_url: coverUrlFor('What\'s Going On','Marvin Gaye') },
  { title: 'Respect', artist: 'Aretha Franklin', album: 'I Never Loved a Man the Way I Love You', duration_seconds: 147, genre: 'R&B', votes: 15, cover_url: coverUrlFor('Respect','Aretha Franklin') },
  { title: 'A Change Is Gonna Come', artist: 'Sam Cooke', album: 'Ain\'t That Good News', duration_seconds: 191, genre: 'R&B', votes: 13, cover_url: coverUrlFor('A Change Is Gonna Come','Sam Cooke') },
  { title: 'Superstition', artist: 'Stevie Wonder', album: 'Talking Book', duration_seconds: 267, genre: 'R&B', votes: 14, cover_url: coverUrlFor('Superstition','Stevie Wonder') },
  { title: 'Let\'s Stay Together', artist: 'Al Green', album: 'Let\'s Stay Together', duration_seconds: 209, genre: 'R&B', votes: 11, cover_url: coverUrlFor('Let\'s Stay Together','Al Green') },
  { title: 'Lean On Me', artist: 'Bill Withers', album: 'Still Bill', duration_seconds: 247, genre: 'R&B', votes: 10, cover_url: coverUrlFor('Lean On Me','Bill Withers') },
  { title: 'Blame It', artist: 'Jamie Foxx', album: 'Intuition', duration_seconds: 294, genre: 'R&B', votes: 9, cover_url: coverUrlFor('Blame It','Jamie Foxx') },
  
  // Hip-Hop & Rap
  { title: 'Fight the Power', artist: 'Public Enemy', album: 'Fear of a Black Planet', duration_seconds: 290, genre: 'Hip-Hop', votes: 11, cover_url: coverUrlFor('Fight the Power','Public Enemy') },
  { title: 'Lose Yourself', artist: 'Eminem', album: '8 Mile Soundtrack', duration_seconds: 326, genre: 'Hip-Hop', votes: 16, cover_url: coverUrlFor('Lose Yourself','Eminem') },
  { title: 'The Message', artist: 'Grandmaster Flash & The Furious Five', album: 'The Message', duration_seconds: 420, genre: 'Hip-Hop', votes: 10, cover_url: coverUrlFor('The Message','Grandmaster Flash & The Furious Five') },
  { title: 'In Da Club', artist: '50 Cent', album: 'Get Rich or Die Tryin\'', duration_seconds: 213, genre: 'Hip-Hop', votes: 14, cover_url: coverUrlFor('In Da Club','50 Cent') },
  { title: 'Juicy', artist: 'The Notorious B.I.G.', album: 'Ready to Die', duration_seconds: 313, genre: 'Hip-Hop', votes: 15, cover_url: coverUrlFor('Juicy','The Notorious B.I.G.') },
  { title: 'N.Y. State of Mind', artist: 'Nas', album: 'Illmatic', duration_seconds: 294, genre: 'Hip-Hop', votes: 13, cover_url: coverUrlFor('N.Y. State of Mind','Nas') },
  { title: 'Gin and Juice', artist: 'Snoop Dogg', album: 'Doggystyle', duration_seconds: 214, genre: 'Hip-Hop', votes: 12, cover_url: coverUrlFor('Gin and Juice','Snoop Dogg') },
  
  // Alternative & Indie
  { title: 'Smells Like Teen Spirit', artist: 'Nirvana', album: 'Nevermind', duration_seconds: 301, genre: 'Alternative', votes: 19, cover_url: coverUrlFor('Smells Like Teen Spirit','Nirvana') },
  { title: 'Creep', artist: 'Radiohead', album: 'Pablo Honey', duration_seconds: 239, genre: 'Alternative', votes: 17, cover_url: coverUrlFor('Creep','Radiohead') },
  { title: 'Seven Nation Army', artist: 'The White Stripes', album: 'Elephant', duration_seconds: 231, genre: 'Alternative', votes: 18, cover_url: coverUrlFor('Seven Nation Army','The White Stripes') },
  { title: 'Mr. Brightside', artist: 'The Killers', album: 'Hot Fuss', duration_seconds: 222, genre: 'Alternative', votes: 15, cover_url: coverUrlFor('Mr. Brightside','The Killers') },
  { title: 'Yukon', artist: 'Dijon', album: 'Swag', duration_seconds: 195, genre: 'Alternative', votes: 6, cover_url: coverUrlFor('Yukon','Dijon') },
  { title: 'Float On', artist: 'Modest Mouse', album: 'Good News for People Who Love Bad News', duration_seconds: 238, genre: 'Alternative', votes: 11, cover_url: coverUrlFor('Float On','Modest Mouse') },
  { title: 'Holland, 1945', artist: 'Neutral Milk Hotel', album: 'In the Aeroplane Over the Sea', duration_seconds: 237, genre: 'Alternative', votes: 8, cover_url: coverUrlFor('Holland, 1945','Neutral Milk Hotel') },
  { title: 'Such Great Heights', artist: 'The Postal Service', album: 'Give Up', duration_seconds: 265, genre: 'Alternative', votes: 12, cover_url: coverUrlFor('Such Great Heights','The Postal Service') },
  
  // Electronic
  { title: 'One More Time', artist: 'Daft Punk', album: 'Discovery', duration_seconds: 320, genre: 'Electronic', votes: 16, cover_url: coverUrlFor('One More Time','Daft Punk') },
  { title: 'Get Lucky', artist: 'Daft Punk', album: 'Random Access Memories', duration_seconds: 248, genre: 'Electronic', votes: 14, cover_url: coverUrlFor('Get Lucky','Daft Punk') },
  { title: 'Midnight City', artist: 'M83', album: 'Hurry Up, We\'re Dreaming', duration_seconds: 242, genre: 'Electronic', votes: 12, cover_url: coverUrlFor('Midnight City','M83') },
  { title: 'Breathe', artist: 'The Prodigy', album: 'The Fat of the Land', duration_seconds: 340, genre: 'Electronic', votes: 11, cover_url: coverUrlFor('Breathe','The Prodigy') },
  { title: 'Strobe', artist: 'deadmau5', album: 'For Lack of a Better Name', duration_seconds: 410, genre: 'Electronic', votes: 9, cover_url: coverUrlFor('Strobe','deadmau5') },
  { title: 'Windowlicker', artist: 'Aphex Twin', album: 'Windowlicker', duration_seconds: 362, genre: 'Electronic', votes: 10, cover_url: coverUrlFor('Windowlicker','Aphex Twin') },
  { title: 'Around the World', artist: 'Daft Punk', album: 'Homework', duration_seconds: 424, genre: 'Electronic', votes: 13, cover_url: coverUrlFor('Around the World','Daft Punk') },
  
  // Jazz
  { title: 'Take Five', artist: 'Dave Brubeck Quartet', album: 'Time Out', duration_seconds: 327, genre: 'Jazz', votes: 13, cover_url: coverUrlFor('Take Five','Dave Brubeck Quartet') },
  { title: 'So What', artist: 'Miles Davis', album: 'Kind of Blue', duration_seconds: 412, genre: 'Jazz', votes: 15, cover_url: coverUrlFor('So What','Miles Davis') },
  { title: 'Blue in Green', artist: 'Miles Davis', album: 'Kind of Blue', duration_seconds: 338, genre: 'Jazz', votes: 10, cover_url: coverUrlFor('Blue in Green','Miles Davis') },
  { title: 'Autumn Leaves', artist: 'Cannonball Adderley', album: 'Somethin\' Else', duration_seconds: 406, genre: 'Jazz', votes: 8, cover_url: coverUrlFor('Autumn Leaves','Cannonball Adderley') },
  { title: 'Giant Steps', artist: 'John Coltrane', album: 'Giant Steps', duration_seconds: 296, genre: 'Jazz', votes: 11, cover_url: coverUrlFor('Giant Steps','John Coltrane') },
  { title: 'A Love Supreme', artist: 'John Coltrane', album: 'A Love Supreme', duration_seconds: 429, genre: 'Jazz', votes: 9, cover_url: coverUrlFor('A Love Supreme','John Coltrane') },
  
  // Classical
  { title: 'Clair de Lune', artist: 'Claude Debussy', album: 'Suite Bergamasque', duration_seconds: 300, genre: 'Classical', votes: 7, cover_url: coverUrlFor('Clair de Lune','Claude Debussy') },
  { title: 'Für Elise', artist: 'Ludwig van Beethoven', album: 'Bagatelle No. 25', duration_seconds: 180, genre: 'Classical', votes: 5, cover_url: coverUrlFor('Für Elise','Ludwig van Beethoven') },
  { title: 'Canon in D', artist: 'Johann Pachelbel', album: 'Canon and Gigue', duration_seconds: 251, genre: 'Classical', votes: 6, cover_url: coverUrlFor('Canon in D','Johann Pachelbel') },
  { title: 'Moonlight Sonata', artist: 'Ludwig van Beethoven', album: 'Piano Sonata No. 14', duration_seconds: 900, genre: 'Classical', votes: 8, cover_url: coverUrlFor('Moonlight Sonata','Ludwig van Beethoven') },
  { title: 'The Four Seasons', artist: 'Antonio Vivaldi', album: 'The Four Seasons', duration_seconds: 2100, genre: 'Classical', votes: 7, cover_url: coverUrlFor('The Four Seasons','Antonio Vivaldi') },
  
  // Country & Folk
  { title: 'Jolene', artist: 'Dolly Parton', album: 'Jolene', duration_seconds: 156, genre: 'Country', votes: 12, cover_url: coverUrlFor('Jolene','Dolly Parton') },
  { title: 'Ring of Fire', artist: 'Johnny Cash', album: 'Ring of Fire', duration_seconds: 155, genre: 'Country', votes: 13, cover_url: coverUrlFor('Ring of Fire','Johnny Cash') },
  { title: 'The Weight', artist: 'The Band', album: 'Music from Big Pink', duration_seconds: 274, genre: 'Folk', votes: 10, cover_url: coverUrlFor('The Weight','The Band') },
  { title: 'Blowin\' in the Wind', artist: 'Bob Dylan', album: 'The Freewheelin\' Bob Dylan', duration_seconds: 171, genre: 'Folk', votes: 11, cover_url: coverUrlFor('Blowin\' in the Wind','Bob Dylan') },
];

async function main() {
  console.log('Seeding database with expanded track library...');

  // Clear existing data (ignore errors if tables don't exist)
  try {
    await prisma.playlistTrack.deleteMany();
    await prisma.playlist.deleteMany();
    await prisma.track.deleteMany();
  } catch (error) {
    // Tables might not exist yet, that's okay
    console.log('Clearing existing data (tables may not exist yet)...');
  }

  // Create tracks with votes (votes are now on Track model)
  const createdTracks = [];
  for (const track of tracks) {
    const { votes = 0, ...trackData } = track;
    const created = await prisma.track.create({
      data: {
        ...trackData,
        votes: votes || 0,
      },
    });
    createdTracks.push(created);
  }

  console.log(`Created ${createdTracks.length} tracks`);

  // Create multiple playlists
  const mainPlaylist = await prisma.playlist.create({
    data: {
      name: 'Main Playlist',
      description: 'The main collaborative playlist',
    },
  });

  const rockPlaylist = await prisma.playlist.create({
    data: {
      name: 'Rock Classics',
      description: 'Classic rock hits and favorites',
    },
  });

  const popPlaylist = await prisma.playlist.create({
    data: {
      name: 'Pop Hits',
      description: 'Modern pop favorites',
    },
  });

  const jazzPlaylist = await prisma.playlist.create({
      data: {
      name: 'Jazz Collection',
      description: 'Smooth jazz and classics',
      },
    });

  const hipHopPlaylist = await prisma.playlist.create({
        data: {
      name: 'Hip-Hop Essentials',
      description: 'Essential hip-hop tracks',
        },
      });

  console.log('Created 5 playlists');

  // Helper function to get tracks by genre
  const getTracksByGenre = (genre) => createdTracks.filter(t => t.genre === genre);

  // Add tracks to Main Playlist (mix of genres)
  const mainPlaylistTracks = [
    { trackId: createdTracks[0].id, position: 1.0, added_by: 'MusicLover' }, // Like a Rolling Stone
    { trackId: createdTracks[1].id, position: 2.0, added_by: 'ClassicRock' }, // Gimme Shelter
    { trackId: createdTracks[18].id, position: 3.0, added_by: 'PopFan' }, // Blinding Lights
    { trackId: createdTracks[32].id, position: 4.0, added_by: 'RBLover' }, // What's Going On
    { trackId: createdTracks[37].id, position: 5.0, added_by: 'HipHopHead' }, // Fight the Power
    { trackId: createdTracks[41].id, position: 6.0, added_by: 'AltRock', is_playing: true }, // Seven Nation Army
    { trackId: createdTracks[12].id, position: 7.0, added_by: 'MusicCritic' }, // Church & State
    { trackId: createdTracks[27].id, position: 8.0, added_by: 'PopFan' }, // Purple Rain
    { trackId: createdTracks[10].id, position: 9.0, added_by: 'RockEnthusiast' }, // Thunder Road
    { trackId: createdTracks[28].id, position: 10.0, added_by: 'Swiftie' }, // Anti-Hero
    { trackId: createdTracks[49].id, position: 11.0, added_by: 'JazzLover' }, // Take Five
    { trackId: createdTracks[25].id, position: 12.0, added_by: 'PopFan' }, // Billie Jean
  ];

  // Add tracks to Rock Classics playlist
  const rockTracks = getTracksByGenre('Rock');
  const rockPlaylistTracks = rockTracks.slice(0, 10).map((track, index) => ({
    playlist_id: rockPlaylist.id,
    track_id: track.id,
    position: (index + 1) * 1.0,
    added_by: 'RockEnthusiast',
    is_playing: index === 0,
    played_at: index === 0 ? new Date() : null,
  }));

  // Add tracks to Pop Hits playlist
  const popTracks = getTracksByGenre('Pop');
  const popPlaylistTracks = popTracks.slice(0, 12).map((track, index) => ({
    playlist_id: popPlaylist.id,
    track_id: track.id,
    position: (index + 1) * 1.0,
    added_by: 'PopFan',
    is_playing: index === 0,
    played_at: index === 0 ? new Date() : null,
  }));

  // Add tracks to Jazz Collection playlist
  const jazzTracks = getTracksByGenre('Jazz');
  const jazzPlaylistTracks = jazzTracks.map((track, index) => ({
    playlist_id: jazzPlaylist.id,
    track_id: track.id,
    position: (index + 1) * 1.0,
    added_by: 'JazzLover',
    is_playing: index === 0,
    played_at: index === 0 ? new Date() : null,
  }));

  // Add tracks to Hip-Hop Essentials playlist
  const hipHopTracks = getTracksByGenre('Hip-Hop');
  const hipHopPlaylistTracks = hipHopTracks.map((track, index) => ({
    playlist_id: hipHopPlaylist.id,
    track_id: track.id,
    position: (index + 1) * 1.0,
    added_by: 'HipHopHead',
    is_playing: index === 0,
    played_at: index === 0 ? new Date() : null,
  }));

  // Create all playlist tracks in parallel
  await Promise.all([
    ...mainPlaylistTracks.map(item => prisma.playlistTrack.create({
      data: {
        playlist_id: mainPlaylist.id,
        track_id: item.trackId,
        position: item.position,
        added_by: item.added_by,
        is_playing: item.is_playing || false,
        played_at: item.is_playing ? new Date() : null,
      },
    })),
    ...rockPlaylistTracks.map(item => prisma.playlistTrack.create({ data: item })),
    ...popPlaylistTracks.map(item => prisma.playlistTrack.create({ data: item })),
    ...jazzPlaylistTracks.map(item => prisma.playlistTrack.create({ data: item })),
    ...hipHopPlaylistTracks.map(item => prisma.playlistTrack.create({ data: item })),
  ]);

  console.log(`Created Main Playlist with ${mainPlaylistTracks.length} tracks`);
  console.log(`Created Rock Classics playlist with ${rockPlaylistTracks.length} tracks`);
  console.log(`Created Pop Hits playlist with ${popPlaylistTracks.length} tracks`);
  console.log(`Created Jazz Collection playlist with ${jazzPlaylistTracks.length} tracks`);
  console.log(`Created Hip-Hop Essentials playlist with ${hipHopPlaylistTracks.length} tracks`);
  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

const MTGCB_API_BASE_URL = process.env.NEXT_PUBLIC_MTGCB_API_BASE_URL || '';

interface CardData {
  cardName: string;
  username: string;
  setName: string;
  quantity: number;
  foilQuantity: number;
  price: number;
  foilPrice: number;
  totalValue: number;
  imageUrl?: string;
  artist?: string;
  rarity?: string;
  manaCost?: string;
  typeLine?: string;
  isPrivate?: boolean;
}

async function fetchCardData(userId: string, cardId: string, shareToken?: string): Promise<CardData | null> {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (shareToken) {
      headers['X-Share-Token'] = shareToken;
    }

    const apiUrl = `${MTGCB_API_BASE_URL}/cards/search`;

    const requestBody = {
      userId: parseInt(userId),
      id: cardId,
      limit: 1,
      offset: 0,
      priceType: 'market',
    };

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      if (response.status === 403) {
        const errorData = await response.json();
        if (errorData?.error?.code === 'COLLECTION_PRIVATE') {
          return {
            cardName: 'Card',
            username: 'User',
            setName: 'Set',
            quantity: 0,
            foilQuantity: 0,
            price: 0,
            foilPrice: 0,
            totalValue: 0,
            isPrivate: true,
          };
        }
      }
      return null;
    }

    const data = await response.json();

    if (data?.success && data?.data?.cards?.length > 0) {
      const card = data.data.cards[0];
      const quantity = card.quantityReg || 0;
      const foilQuantity = card.quantityFoil || 0;
      const price = parseFloat(card.market) || 0;
      const foilPrice = parseFloat(card.foil) || 0;

      const result = {
        cardName: card.name || 'Unknown Card',
        username: data.data.username || 'User',
        setName: card.setName || 'Unknown Set',
        quantity,
        foilQuantity,
        price,
        foilPrice,
        totalValue: quantity * price + foilQuantity * foilPrice,
        imageUrl: card.imageUrl,
        artist: card.artist,
        rarity: card.rarity,
        manaCost: card.manaCost,
        typeLine: card.type,
        isPrivate: false,
      };
      return result;
    }

    return null;
  } catch (error) {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const cardId = searchParams.get('cardId');
    const shareToken = searchParams.get('shareToken');

    if (!userId || !cardId) {
      return new Response('Missing userId or cardId', { status: 400 });
    }

    const cardData = await fetchCardData(userId, cardId, shareToken || undefined);

    // Default values
    const isPrivate = cardData?.isPrivate ?? false;
    const cardName = cardData?.cardName || 'Card';
    const username = cardData?.username || 'User';
    const setName = cardData?.setName || 'Set';
    const quantity = cardData?.quantity || 0;
    const foilQuantity = cardData?.foilQuantity || 0;
    const price = cardData?.price || 0;
    const foilPrice = cardData?.foilPrice || 0;
    const totalValue = cardData?.totalValue || 0;
    const rarity = cardData?.rarity || '';
    const typeLine = cardData?.typeLine || '';

    const getRarityColor = (rarity: string) => {
      const rarityLower = rarity.toLowerCase();
      if (rarityLower.includes('mythic')) return '#ff6b35';
      if (rarityLower.includes('rare')) return '#daa520';
      if (rarityLower.includes('uncommon')) return '#70798c';
      return '#999999';
    };
    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            height: '100%',
            background: 'linear-gradient(135deg, #050a30 0%, #2e0845 100%)',
            padding: 60,
            fontFamily: 'system-ui, -apple-system, sans-serif',
            position: 'relative',
          }}
        >
          {/* Subtle gradient overlay at bottom */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '200px',
              background: 'linear-gradient(to bottom, transparent, rgba(0, 0, 0, 0.3))',
              pointerEvents: 'none',
            }}
          />

          {isPrivate ? (
            // Private Collection View
            <div
              style={{
                display: 'flex',
                flex: 1,
                flexDirection: 'column',
                gap: 30,
                position: 'relative',
              }}
            >
              {/* Logo and Title */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-end',
                  gap: 30,
                }}
              >
                <img
                  src="https://r2.mtgcollectionbuilder.com/images/mtgcb-logo.png"
                  alt="MTG Collection Builder"
                  width={130}
                  height={130}
                  style={{
                    objectFit: 'contain',
                  }}
                />
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                    flex: 1,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      fontSize: 72,
                      fontWeight: 700,
                      color: '#ffffff',
                    }}
                  >
                    Private Collection
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      fontSize: 36,
                      color: '#999999',
                    }}
                  >
                    on MTG Collection Builder
                  </div>
                </div>
              </div>

              {/* Private message */}
              <div
                style={{
                  display: 'flex',
                  flex: 1,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: 60,
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: 20,
                    border: '2px solid rgba(255, 255, 255, 0.1)',
                  }}
                >
                  <svg width="80" height="80" viewBox="0 0 24 24" fill="none" style={{ marginBottom: 30 }}>
                    <path
                      d="M12 2C9.243 2 7 4.243 7 7v3H6a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2v-8a2 2 0 00-2-2h-1V7c0-2.757-2.243-5-5-5zM9 7c0-1.654 1.346-3 3-3s3 1.346 3 3v3H9V7zm4 10.723V19a1 1 0 11-2 0v-1.277a2 2 0 112 0z"
                      fill="#666666"
                    />
                  </svg>
                  <div
                    style={{
                      display: 'flex',
                      fontSize: 36,
                      color: '#999999',
                    }}
                  >
                    This collection is not publicly visible
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Public Card View
            <div
              style={{
                display: 'flex',
                flex: 1,
                flexDirection: 'column',
                gap: 25,
                position: 'relative',
              }}
            >
              {/* Title Section with Logo */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-end',
                  gap: 30,
                }}
              >
                <img
                  src="https://r2.mtgcollectionbuilder.com/images/mtgcb-logo.png"
                  alt="MTG Collection Builder"
                  width={130}
                  height={130}
                  style={{
                    objectFit: 'contain',
                  }}
                />
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                    flex: 1,
                    minWidth: 0,
                    maxWidth: 590, // Adjusted for better visual balance
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      fontSize: 56,
                      fontWeight: 700,
                      color: '#ffffff',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      maxWidth: '100%',
                    }}
                  >
                    {cardName}
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      fontSize: 30,
                      color: '#999999',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      maxWidth: '100%',
                    }}
                  >
                    {setName}
                  </div>
                </div>
              </div>

              {/* Collection Info */}
              <div
                style={{
                  display: 'flex',
                  fontSize: 28,
                  color: '#666666',
                  marginTop: -10,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: 750, // Account for card image on the right
                }}
              >
                in {username}'s Collection on MTG CB
              </div>

              {/* Main Content Container with Image */}
              <div
                style={{
                  display: 'flex',
                  gap: 40,
                  alignItems: 'flex-start',
                  flex: 1,
                  width: '100%',
                  marginTop: -160,
                }}
              >
                {/* Left Side - Stats */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 30,
                    flex: 1,
                    paddingTop: 170,
                    marginTop: 20,
                  }}
                >
                  {/* Stats Container */}
                  <div
                    style={{
                      display: 'flex',
                      gap: 30,
                    }}
                  >
                    {/* Regular Cards */}
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        padding: '25px 30px',
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: 20,
                        border: '2px solid rgba(255, 255, 255, 0.1)',
                        gap: 10,
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          fontSize: 20,
                          color: '#999999',
                          textTransform: 'uppercase',
                          letterSpacing: '2px',
                        }}
                      >
                        Regular
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          fontSize: 48,
                          fontWeight: 700,
                          color: '#1976d2',
                        }}
                      >
                        {quantity}x
                      </div>
                    </div>

                    {/* Foil Cards */}
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        padding: '25px 30px',
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: 20,
                        border: '2px solid rgba(255, 255, 255, 0.1)',
                        gap: 10,
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          fontSize: 20,
                          color: '#999999',
                          textTransform: 'uppercase',
                          letterSpacing: '2px',
                        }}
                      >
                        Foil ✨
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          fontSize: 48,
                          fontWeight: 700,
                          color: '#1976d2',
                        }}
                      >
                        {foilQuantity}x
                      </div>
                    </div>
                  </div>

                  {/* Total Stats */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 15,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        fontSize: 44,
                        fontWeight: 700,
                        color: '#1976d2',
                      }}
                    >
                      {quantity + foilQuantity}
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        fontSize: 28,
                        color: '#999999',
                      }}
                    >
                      total cards owned
                    </div>
                  </div>
                </div>

                {/* Right Side - Card Image */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '320px',
                    height: '446px',
                    marginTop: -20,
                  }}
                >
                  <img
                    src={`https://r2.mtgcollectionbuilder.com/cards/images/normal/${cardId}.jpg?v=${process.env.NEXT_PUBLIC_IMAGE_CACHE_DATE || '20241220'}`}
                    alt={cardName}
                    width={320}
                    height={446}
                    style={{
                      borderRadius: setName === 'Limited Edition Alpha' ? '7%' : '5%',
                      boxShadow: '0 15px 40px rgba(0, 0, 0, 0.6)',
                      objectFit: 'contain',
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      ),
      {
        width: 1200,
        height: 630,
      },
    );
  } catch (error) {
    return new Response(`Failed to generate image: ${(error as Error).message}`, { status: 500 });
  }
}

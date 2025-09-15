'use client';

import { Download as DownloadIcon } from '@mui/icons-material';
import { Box, Button, Container, Divider, Typography } from '@mui/material';

export default function BinderTemplatesPage() {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ maxWidth: 900, mx: 'auto' }}>
        {/* Header */}
        <Box sx={{ mb: 3, textAlign: 'center' }}>
          <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
            Binder Templates
          </Typography>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Printable covers and spine labels for your collection binders
          </Typography>
        </Box>

        {/* Screenshot Section */}
        <Box sx={{ mb: 5 }}>
          <Box
            component="a"
            href="https://drive.google.com/drive/folders/1-4f_ba2kTf4E37CAN_KG6PTIOKnkPaWn?usp=sharing"
            target="_blank"
            rel="noopener noreferrer"
            sx={{ display: 'flex', justifyContent: 'center' }}
          >
            <Box
              component="img"
              src="https://r2.mtgcollectionbuilder.com/images/mtgcb-binders.png"
              alt="Binder Templates Example"
              sx={{
                width: '100%',
                maxWidth: '667px', // Maintain aspect ratio (900/675 = 1.33, so 500*1.33 = 667)
                height: 'auto',
                borderRadius: '20px',
              }}
            />
          </Box>

          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Button
              variant="contained"
              color="primary"
              size="large"
              href="https://drive.google.com/drive/folders/1-4f_ba2kTf4E37CAN_KG6PTIOKnkPaWn?usp=sharing"
              target="_blank"
              rel="noopener noreferrer"
              sx={{ px: 4, py: 1.5 }}
              startIcon={<DownloadIcon />}
            >
              Access Binder Templates
            </Button>
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* What It Is */}
        <Box sx={{ mb: 5 }}>
          <Typography variant="h4" component="h2" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
            What Are These Templates?
          </Typography>
          <Typography variant="body1" paragraph>
            These are custom 3-ring binder templates for their covers and spines. I made them for my own collection,
            then folks started asking for me to share the PDFs.
          </Typography>
          <Typography variant="body1" paragraph>
            Just download the PDFs and print them in their original size. The quality of the printer doesn't really
            matter in my opinion since these are viewed from afar. I have a folder with the PSDs too if you know your
            way around Photoshop and want to make changes.
          </Typography>
          <Typography variant="body1" paragraph>
            The binders used are the{' '}
            <Typography
              component="a"
              href="http://www.amazon.com/gp/product/B000A6V0JO/"
              target="_blank"
              rel="noopener noreferrer"
              sx={{ color: 'primary.main', textDecoration: 'none' }}
            >
              Avery Heavy-Duty View Binder with 1.5 Inch One Touch EZD Ring, Black, 1 Binder (79695)
            </Typography>
            . I experimented quite a bit and found this one worked best for me, as it had panes to put in your own
            printouts for the front, back, and side, and felt quite sturdy. I hear rumors that they're matte now instead
            of glossy, so you may have to look around if you have a preference.
          </Typography>
          <Typography variant="body1" paragraph>
            For sleeve pages, I use the{' '}
            <Typography
              component="a"
              href="http://www.amazon.com/gp/product/B00095M5DQ/"
              target="_blank"
              rel="noopener noreferrer"
              sx={{ color: 'primary.main', textDecoration: 'none' }}
            >
              Ultra Pro 9-Pocket Trading Card Pages - Platinum Series (100 Pages)
            </Typography>
            .
          </Typography>
          <Typography variant="body1" paragraph>
            At first, I only made folders for sets I owned. But I started getting requests for other sets and I keep up
            with new releases. Feel free to contact me if there's one I'm missing. I work on these as a break from
            programming.
          </Typography>
        </Box>

        {/* Note */}
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            These templates are fan-made organizational tools provided free for personal use. Magic: The Gathering is a
            trademark of Wizards of the Coast.
          </Typography>
        </Box>
      </Box>
    </Container>
  );
}

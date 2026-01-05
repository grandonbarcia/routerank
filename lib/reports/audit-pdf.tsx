import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

export type PdfSeverity = 'critical' | 'high' | 'medium' | 'low';
export type PdfCategory = 'seo' | 'performance' | 'nextjs';

export type AuditPdfIssue = {
  id: string;
  category: PdfCategory;
  severity: PdfSeverity;
  title: string;
  message: string;
  fixSuggestion?: string | null;
};

export type AuditPdfScan = {
  id: string;
  url: string;
  domain: string;
  seoScore: number | null;
  performanceScore: number | null;
  nextjsScore: number | null;
  overallScore: number | null;
  createdAt: string;
  completedAt: string | null;
};

export type AuditPdfData = {
  scan: AuditPdfScan;
  issues: AuditPdfIssue[];
  generatedAt: string;
};

const styles = StyleSheet.create({
  page: { paddingTop: 32, paddingBottom: 32, paddingHorizontal: 36 },
  header: { marginBottom: 18 },
  title: { fontSize: 20, fontWeight: 700 },
  subtitle: { marginTop: 4, fontSize: 10, color: '#4B5563' },
  divider: { marginTop: 14, height: 1, backgroundColor: '#E5E7EB' },

  sectionTitle: {
    marginTop: 18,
    marginBottom: 8,
    fontSize: 12,
    fontWeight: 700,
  },

  row: { flexDirection: 'row', gap: 10 },
  card: {
    flexGrow: 1,
    flexBasis: 0,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 10,
  },
  cardLabel: { fontSize: 9, color: '#6B7280' },
  cardValue: { marginTop: 4, fontSize: 18, fontWeight: 700 },

  issue: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  issueMetaRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  pill: {
    fontSize: 8,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 999,
  },
  issueTitle: { marginTop: 6, fontSize: 11, fontWeight: 700 },
  issueMessage: { marginTop: 4, fontSize: 10, color: '#374151' },
  issueFixLabel: {
    marginTop: 8,
    fontSize: 9,
    fontWeight: 700,
    color: '#111827',
  },
  issueFix: { marginTop: 3, fontSize: 10, color: '#1F2937' },

  footer: { marginTop: 18, fontSize: 9, color: '#6B7280' },
});

function severityColor(severity: PdfSeverity): { bg: string; fg: string } {
  switch (severity) {
    case 'critical':
      return { bg: '#FEE2E2', fg: '#991B1B' };
    case 'high':
      return { bg: '#FFEDD5', fg: '#9A3412' };
    case 'medium':
      return { bg: '#FEF3C7', fg: '#92400E' };
    case 'low':
    default:
      return { bg: '#DBEAFE', fg: '#1E40AF' };
  }
}

function formatCategory(category: PdfCategory): string {
  return category === 'nextjs' ? 'Next.js' : category.toUpperCase();
}

export function AuditPdfDocument({
  data,
  whiteLabel,
}: {
  data: AuditPdfData;
  whiteLabel: boolean;
}) {
  const completedAt = data.scan.completedAt || data.scan.createdAt;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>
            {whiteLabel ? 'Website Audit Report' : 'RouteRank Audit Report'}
          </Text>
          <Text style={styles.subtitle}>{data.scan.domain}</Text>
          <Text style={styles.subtitle}>URL: {data.scan.url}</Text>
          <Text style={styles.subtitle}>
            Completed: {new Date(completedAt).toLocaleString()}
          </Text>
          <View style={styles.divider} />
        </View>

        <Text style={styles.sectionTitle}>Scores</Text>
        <View style={styles.row}>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Overall</Text>
            <Text style={styles.cardValue}>
              {data.scan.overallScore ?? '—'}
            </Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>SEO</Text>
            <Text style={styles.cardValue}>{data.scan.seoScore ?? '—'}</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Performance</Text>
            <Text style={styles.cardValue}>
              {data.scan.performanceScore ?? '—'}
            </Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Next.js</Text>
            <Text style={styles.cardValue}>{data.scan.nextjsScore ?? '—'}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Issues ({data.issues.length})</Text>
        {data.issues.length === 0 ? (
          <View style={styles.issue}>
            <Text style={styles.issueTitle}>No issues found</Text>
            <Text style={styles.issueMessage}>
              Great job — no major issues were detected.
            </Text>
          </View>
        ) : (
          data.issues.slice(0, 50).map((issue) => {
            const colors = severityColor(issue.severity);
            return (
              <View key={issue.id} style={styles.issue}>
                <View style={styles.issueMetaRow}>
                  <Text
                    style={{
                      ...styles.pill,
                      backgroundColor: colors.bg,
                      color: colors.fg,
                    }}
                  >
                    {issue.severity.toUpperCase()}
                  </Text>
                  <Text style={{ fontSize: 9, color: '#6B7280' }}>
                    {formatCategory(issue.category)}
                  </Text>
                </View>

                <Text style={styles.issueTitle}>{issue.title}</Text>
                <Text style={styles.issueMessage}>{issue.message}</Text>

                {issue.fixSuggestion ? (
                  <>
                    <Text style={styles.issueFixLabel}>Suggested fix</Text>
                    <Text style={styles.issueFix}>{issue.fixSuggestion}</Text>
                  </>
                ) : null}
              </View>
            );
          })
        )}

        <Text style={styles.footer}>
          Generated: {new Date(data.generatedAt).toLocaleString()}
          {whiteLabel ? '' : ' • Powered by RouteRank'}
        </Text>
      </Page>
    </Document>
  );
}

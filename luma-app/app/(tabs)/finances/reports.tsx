import { useMemo } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, TrendingUp, PieChart as PieChartIcon } from 'lucide-react-native';
import { Platform } from 'react-native';

// Lazy import para react-native-chart-kit (pode ter problemas em web)
let LineChart: any;
let RNPieChart: any;

if (Platform.OS !== 'web') {
  try {
    const chartKit = require('react-native-chart-kit');
    LineChart = chartKit.LineChart;
    RNPieChart = chartKit.PieChart;
  } catch (error) {
    console.warn('react-native-chart-kit não disponível:', error);
  }
}

import { useExpenses } from '@/hooks/useExpenses';
import { useAuthStore } from '@/stores/auth.store';
import { cardShadowStyle } from '@/lib/styles';
import type { Expense } from '@/types/models';

const formatCurrency = (value: number) =>
  value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });

const chartConfig = {
  backgroundColor: '#ffffff',
  backgroundGradientFrom: '#ffffff',
  backgroundGradientTo: '#ffffff',
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(29, 78, 216, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(15, 23, 42, ${opacity})`,
  style: {
    borderRadius: 16,
  },
  propsForDots: {
    r: '6',
    strokeWidth: '2',
    stroke: '#1d4ed8',
  },
};

const pieChartConfig = {
  backgroundColor: '#ffffff',
  backgroundGradientFrom: '#ffffff',
  backgroundGradientTo: '#ffffff',
  color: (opacity = 1) => `rgba(29, 78, 216, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(15, 23, 42, ${opacity})`,
};

export default function ReportsScreen() {
  const router = useRouter();
  const houseId = useAuthStore((state) => state.houseId);
  const { top } = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const { data: expenses, isLoading } = useExpenses(houseId);

  // Agrupar despesas por categoria
  const expensesByCategory = useMemo(() => {
    if (!expenses) return {};
    const grouped: Record<string, { total: number; count: number; categoryName: string }> = {};
    
    expenses.forEach((expense) => {
      const categoryId = expense.categoryId || 'sem-categoria';
      const categoryName = expense.category?.name || 'Sem categoria';
      
      if (!grouped[categoryId]) {
        grouped[categoryId] = { total: 0, count: 0, categoryName };
      }
      
      grouped[categoryId].total += Number(expense.amount);
      grouped[categoryId].count += 1;
    });
    
    return grouped;
  }, [expenses]);

  // Agrupar despesas por mês (últimos 6 meses)
  const expensesByMonth = useMemo(() => {
    if (!expenses) return [];
    
    const months: Record<string, number> = {};
    const now = new Date();
    
    // Inicializar últimos 6 meses
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      months[key] = 0;
    }
    
    expenses.forEach((expense) => {
      const expenseDate = new Date(expense.expenseDate);
      const key = `${expenseDate.getFullYear()}-${String(expenseDate.getMonth() + 1).padStart(2, '0')}`;
      
      if (months[key] !== undefined) {
        months[key] += Number(expense.amount);
      }
    });
    
    return Object.entries(months)
      .map(([month, total]) => ({
        month,
        total,
        label: new Date(month + '-01').toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }),
      }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }, [expenses]);

  // Preparar dados para gráfico de pizza
  const pieChartData = useMemo(() => {
    const categories = Object.values(expensesByCategory);
    if (categories.length === 0) return [];
    
    const colors = [
      '#1d4ed8', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
      '#06b6d4', '#ec4899', '#84cc16', '#f97316', '#6366f1',
    ];
    
    return categories
      .sort((a, b) => b.total - a.total)
      .slice(0, 10)
      .map((cat, index) => ({
        name: cat.categoryName.length > 15 ? cat.categoryName.substring(0, 15) + '...' : cat.categoryName,
        amount: cat.total,
        color: colors[index % colors.length],
        legendFontColor: '#64748b',
        legendFontSize: 12,
      }));
  }, [expensesByCategory]);

  // Preparar dados para gráfico de linha
  const lineChartData = useMemo(() => {
    if (expensesByMonth.length === 0) {
      return {
        labels: ['', '', '', '', '', ''],
        datasets: [
          {
            data: [0, 0, 0, 0, 0, 0],
            color: (opacity = 1) => `rgba(29, 78, 216, ${opacity})`,
            strokeWidth: 2,
          },
        ],
      };
    }
    
    return {
      labels: expensesByMonth.map((item) => item.label.substring(0, 3)),
      datasets: [
        {
          data: expensesByMonth.map((item) => item.total),
          color: (opacity = 1) => `rgba(29, 78, 216, ${opacity})`,
          strokeWidth: 2,
        },
      ],
    };
  }, [expensesByMonth]);

  const totalExpenses = expenses?.reduce((sum, expense) => sum + Number(expense.amount), 0) ?? 0;
  const averageMonthly = expensesByMonth.length > 0
    ? expensesByMonth.reduce((sum, item) => sum + item.total, 0) / expensesByMonth.length
    : 0;

  if (!houseId) {
    return (
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.container, styles.centered, { paddingTop: top + 16 }]}
      >
        <Text style={styles.emptyTitle}>Selecione uma casa</Text>
        <Text style={styles.emptySubtitle}>
          Associe-se a uma casa para ver os relatórios financeiros.
        </Text>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.container, { paddingTop: top + 16 }]}
    >
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.title}>Relatórios Financeiros</Text>
      </View>

      {isLoading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color="#1d4ed8" />
          <Text style={styles.helperText}>Carregando dados...</Text>
        </View>
      ) : (
        <>
          {/* Resumo */}
          <View style={[styles.summaryCard, cardShadowStyle]}>
            <Text style={styles.cardTitle}>Resumo Geral</Text>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Total de Despesas</Text>
                <Text style={styles.summaryValue}>{formatCurrency(totalExpenses)}</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Média Mensal</Text>
                <Text style={styles.summaryValue}>{formatCurrency(averageMonthly)}</Text>
              </View>
            </View>
          </View>

          {/* Gráfico de Evolução Mensal */}
          {expensesByMonth.length > 0 && LineChart && (
            <View style={[styles.chartCard, cardShadowStyle]}>
              <View style={styles.chartHeader}>
                <TrendingUp size={20} color="#1d4ed8" />
                <Text style={styles.chartTitle}>Evolução Mensal (Últimos 6 meses)</Text>
              </View>
              <LineChart
                data={lineChartData}
                width={screenWidth - 80}
                height={220}
                chartConfig={chartConfig}
                bezier
                style={styles.chart}
                withInnerLines={false}
                withOuterLines={true}
                withVerticalLabels={true}
                withHorizontalLabels={true}
                withDots={true}
                withShadow={false}
              />
            </View>
          )}

          {/* Fallback para web ou quando gráficos não estão disponíveis */}
          {expensesByMonth.length > 0 && !LineChart && (
            <View style={[styles.chartCard, cardShadowStyle]}>
              <View style={styles.chartHeader}>
                <TrendingUp size={20} color="#1d4ed8" />
                <Text style={styles.chartTitle}>Evolução Mensal (Últimos 6 meses)</Text>
              </View>
              <View style={styles.chartPlaceholder}>
                <Text style={styles.chartPlaceholderText}>
                  Gráficos disponíveis apenas em dispositivos móveis
                </Text>
                <View style={styles.monthlyList}>
                  {expensesByMonth.map((item, index) => (
                    <View key={index} style={styles.monthlyItem}>
                      <Text style={styles.monthlyLabel}>{item.label}</Text>
                      <Text style={styles.monthlyValue}>{formatCurrency(item.total)}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          )}

          {/* Gráfico de Pizza por Categoria */}
          {pieChartData.length > 0 && RNPieChart && (
            <View style={[styles.chartCard, cardShadowStyle]}>
              <View style={styles.chartHeader}>
                <PieChartIcon size={20} color="#1d4ed8" />
                <Text style={styles.chartTitle}>Gastos por Categoria</Text>
              </View>
              <RNPieChart
                data={pieChartData}
                width={screenWidth - 80}
                height={220}
                chartConfig={pieChartConfig}
                accessor="amount"
                backgroundColor="transparent"
                paddingLeft="15"
                absolute
              />
            </View>
          )}

          {/* Lista de Categorias */}
          {Object.keys(expensesByCategory).length > 0 && (
            <View style={[styles.categoriesCard, cardShadowStyle]}>
              <Text style={styles.cardTitle}>Detalhamento por Categoria</Text>
              <View style={styles.categoriesList}>
                {Object.values(expensesByCategory)
                  .sort((a, b) => b.total - a.total)
                  .map((category, index) => {
                    const percentage = totalExpenses > 0 ? (category.total / totalExpenses) * 100 : 0;
                    return (
                      <View key={index} style={styles.categoryRow}>
                        <View style={styles.categoryInfo}>
                          <Text style={styles.categoryName}>{category.categoryName}</Text>
                          <Text style={styles.categoryCount}>{category.count} despesa(s)</Text>
                        </View>
                        <View style={styles.categoryAmount}>
                          <Text style={styles.categoryValue}>{formatCurrency(category.total)}</Text>
                          <Text style={styles.categoryPercentage}>{percentage.toFixed(1)}%</Text>
                        </View>
                      </View>
                    );
                  })}
              </View>
            </View>
          )}

          {expenses && expenses.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>Nenhuma despesa registrada</Text>
              <Text style={styles.emptySubtitle}>
                Comece registrando despesas para ver os relatórios e gráficos.
              </Text>
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#0f172a',
  },
  loadingState: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  helperText: {
    fontSize: 14,
    color: '#64748b',
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    gap: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 16,
  },
  summaryItem: {
    flex: 1,
    gap: 4,
  },
  summaryLabel: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1d4ed8',
  },
  chartCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    gap: 16,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  categoriesCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    gap: 16,
  },
  categoriesList: {
    gap: 12,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  categoryInfo: {
    flex: 1,
    gap: 4,
  },
  categoryName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
  },
  categoryCount: {
    fontSize: 13,
    color: '#64748b',
  },
  categoryAmount: {
    alignItems: 'flex-end',
    gap: 4,
  },
  categoryValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1d4ed8',
  },
  categoryPercentage: {
    fontSize: 12,
    color: '#94a3b8',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 4,
  },
  chartPlaceholder: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  chartPlaceholderText: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 16,
  },
  monthlyList: {
    width: '100%',
    gap: 8,
  },
  monthlyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
  },
  monthlyLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
  },
  monthlyValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1d4ed8',
  },
});


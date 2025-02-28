import { Budget } from "@shared/schema";
import { PDFDownloadLink, Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { Button } from "../ui/button";
import { FileDown } from "lucide-react";
import { useEffect, useState } from "react";

const styles = StyleSheet.create({
    page: {
        flexDirection: "column",
        backgroundColor: "#fff",
        padding: 30,
    },
    header: {
        marginBottom: 20,
    },
    title: {
        fontSize: 20,
        marginBottom: 10,
    },
    section: {
        margin: 10,
        padding: 10,
    },
    table: {
        display: "table",
        width: "100%",
        borderStyle: "solid",
        borderWidth: 1,
        borderRightWidth: 0,
        borderBottomWidth: 0,
    },
    tableRow: {
        flexDirection: "row",
    },
    tableCol: {
        width: "25%",
        borderStyle: "solid",
        borderWidth: 1,
        borderLeftWidth: 0,
        borderTopWidth: 0,
    },
    tableCell: {
        margin: 5,
        fontSize: 10,
    },
    total: {
        marginTop: 20,
        textAlign: "right",
        fontSize: 14,
    },
});

const BudgetDocument = ({ budget }: { budget: Budget }) => (
    <Document>
        <Page size="A4" style={styles.page}>
            <View style={styles.header}>
                <Text style={styles.title}>Orçamento #{budget.id}</Text>
                <Text>Data: {new Date(budget.date).toLocaleDateString("pt-BR")}</Text>
            </View>

            <View style={styles.section}>
                <Text>Cliente: {budget.client_name}</Text>
                <Text>Endereço: {budget.client_address}</Text>
                <Text>Cidade: {budget.client_city}</Text>
                <Text>Contato: {budget.client_contact}</Text>
            </View>

            <View style={styles.section}>
                <Text>Local da Obra: {budget.work_location}</Text>
                <Text>Tipo de Serviço: {budget.service_type}</Text>
            </View>

            {budget.services && budget.services.length > 0 && (
                <View style={styles.section}>
                    <Text style={{ fontSize: 14, marginBottom: 10 }}>Serviços</Text>
                    <View style={styles.table}>
                        <View style={[styles.tableRow, { backgroundColor: "#f3f4f6" }]}>
                            <View style={styles.tableCol}>
                                <Text style={styles.tableCell}>Serviço</Text>
                            </View>
                            <View style={styles.tableCol}>
                                <Text style={styles.tableCell}>Quantidade</Text>
                            </View>
                            <View style={styles.tableCol}>
                                <Text style={styles.tableCell}>Preço Un.</Text>
                            </View>
                            <View style={styles.tableCol}>
                                <Text style={styles.tableCell}>Total</Text>
                            </View>
                        </View>
                        {budget.services.map((service, index) => (
                            <View style={styles.tableRow} key={index}>
                                <View style={styles.tableCol}>
                                    <Text style={styles.tableCell}>{service.name}</Text>
                                </View>
                                <View style={styles.tableCol}>
                                    <Text style={styles.tableCell}>{service.quantity}</Text>
                                </View>
                                <View style={styles.tableCol}>
                                    <Text style={styles.tableCell}>
                                        R$ {service.unitPrice.toFixed(2)}
                                    </Text>
                                </View>
                                <View style={styles.tableCol}>
                                    <Text style={styles.tableCell}>
                                        R$ {service.total.toFixed(2)}
                                    </Text>
                                </View>
                            </View>
                        ))}
                    </View>
                </View>
            )}

            {budget.materials && budget.materials.length > 0 && (
                <View style={styles.section}>
                    <Text style={{ fontSize: 14, marginBottom: 10 }}>Materiais</Text>
                    <View style={styles.table}>
                        <View style={[styles.tableRow, { backgroundColor: "#f3f4f6" }]}>
                            <View style={styles.tableCol}>
                                <Text style={styles.tableCell}>Material</Text>
                            </View>
                            <View style={styles.tableCol}>
                                <Text style={styles.tableCell}>Quantidade</Text>
                            </View>
                            <View style={styles.tableCol}>
                                <Text style={styles.tableCell}>Preço Un.</Text>
                            </View>
                            <View style={styles.tableCol}>
                                <Text style={styles.tableCell}>Total</Text>
                            </View>
                        </View>
                        {budget.materials.map((material, index) => (
                            <View style={styles.tableRow} key={index}>
                                <View style={styles.tableCol}>
                                    <Text style={styles.tableCell}>{material.name}</Text>
                                </View>
                                <View style={styles.tableCol}>
                                    <Text style={styles.tableCell}>{material.quantity}</Text>
                                </View>
                                <View style={styles.tableCol}>
                                    <Text style={styles.tableCell}>
                                        R$ {material.unitPrice.toFixed(2)}
                                    </Text>
                                </View>
                                <View style={styles.tableCol}>
                                    <Text style={styles.tableCell}>
                                        R$ {material.total.toFixed(2)}
                                    </Text>
                                </View>
                            </View>
                        ))}
                    </View>
                </View>
            )}

            <View style={styles.section}>
                <Text style={styles.total}>
                    Mão de Obra: R$ {budget.labor_cost}
                </Text>
                <Text style={[styles.total, { fontWeight: "bold" }]}>
                    Total: R$ {budget.total_cost}
                </Text>
            </View>
        </Page>
    </Document>
);

export function BudgetPDF({ budget }: { budget: Budget }) {
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    if (!isClient) {
        return null;
    }

    const fileName = `orcamento-${budget.id}-${budget.client_name.toLowerCase().replace(/\s+/g, '-')}.pdf`;

    return (
        <PDFDownloadLink
            document={<BudgetDocument budget={budget} />}
            fileName={fileName}
        >
            {({ loading }) => (
                <Button variant="outline" disabled={loading}>
                    <FileDown className="h-4 w-4 mr-2" />
                    {loading ? "Gerando PDF..." : "Baixar PDF"}
                </Button>
            )}
        </PDFDownloadLink>
    );
} 